import ReactQuill from "react-quill-new";
import Box from "@mui/material/Box";
import FormLabel from "@mui/material/FormLabel";
import "react-quill-new/dist/quill.snow.css";

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ list: "ordered" }, { list: "bullet" }],
    ["blockquote", "code-block"],
    ["link", "image"],
    ["clean"],
  ],
};

const formats = [
  "header",
  "bold",
  "italic",
  "underline",
  "strike",
  "list",
  "bullet",
  "blockquote",
  "code-block",
  "link",
  "image",
];

// Quill editor skinned to match the MUI theme.
export default function RichTextField({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  minHeight = 280,
}) {
  return (
    <Box>
      {label && <FormLabel sx={{ mb: 1, display: "block" }}>{label}</FormLabel>}
      <Box
        sx={{
          "& .ql-toolbar": {
            borderTopLeftRadius: 10,
            borderTopRightRadius: 10,
            borderColor: "divider",
          },
          "& .ql-container": {
            borderBottomLeftRadius: 10,
            borderBottomRightRadius: 10,
            borderColor: "divider",
            fontFamily: "inherit",
            fontSize: 15,
          },
          "& .ql-editor": { minHeight },
        }}
      >
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          formats={formats}
          placeholder={placeholder}
          readOnly={disabled}
        />
      </Box>
    </Box>
  );
}
