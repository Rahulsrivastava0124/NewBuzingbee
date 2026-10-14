const sanitizeHtml = require("sanitize-html");

// Allow-list that covers what the Quill editor produces. Everything else
// (script, iframe, style, on* handlers, javascript: links...) is removed.
const RICH_TEXT_OPTIONS = {
  allowedTags: [
    "p", "br", "strong", "b", "em", "i", "u", "s", "strike", "sub", "sup",
    "h1", "h2", "h3", "h4", "ul", "ol", "li", "blockquote", "pre", "code",
    "a", "img", "span", "div", "hr", "table", "thead", "tbody", "tr", "th", "td",
  ],
  allowedAttributes: {
    a: ["href", "name", "target", "rel"],
    img: ["src", "alt", "title", "width", "height"],
    "*": ["class"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  // Editor-pasted images can be embedded data URLs; only for images.
  allowedSchemesByTag: { img: ["http", "https", "data"] },
  allowProtocolRelative: false,
  transformTags: {
    a: (tagName, attribs) => ({
      tagName,
      attribs: {
        ...attribs,
        // Stop reverse-tabnabbing from user-supplied links
        ...(attribs.target === "_blank" ? { rel: "noopener noreferrer" } : {}),
      },
    }),
  },
  // Keep only class names the editor uses (ql-*)
  allowedClasses: { "*": [/^ql-/] },
};

const sanitizeRichText = (value) =>
  typeof value === "string" ? sanitizeHtml(value, RICH_TEXT_OPTIONS) : value;

module.exports = { sanitizeRichText };
