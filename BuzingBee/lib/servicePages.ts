// Content for the dedicated service landing pages at /services/<slug>.
// Each page has its own title, description and URL so search engines can list it
// on its own (and pick it as a sitelink under the main BuzingBee result).

export type ServicePage = {
  slug: string;
  /** short name, used in menus, footer and breadcrumbs */
  name: string;
  /** <title> (the site template adds " | BuzingBee") */
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  eyebrow: string;
  heading: string;
  intro: string;
  offerings: { title: string; desc: string }[];
  process: { title: string; desc: string }[];
  faqs: { q: string; a: string }[];
};

export const SERVICE_PAGES: ServicePage[] = [
  {
    slug: "shopify-development",
    name: "Shopify Stores",
    metaTitle: "Shopify Store Development Agency",
    metaDescription:
      "BuzingBee builds, customises and optimises Shopify stores that convert: theme design, custom sections, apps, migrations, speed and conversion optimisation.",
    keywords: [
      "shopify store development",
      "shopify development agency",
      "shopify website design",
      "shopify theme customization",
      "shopify store setup india",
      "ecommerce website development",
      "shopify conversion optimization",
    ],
    eyebrow: "Shopify Stores",
    heading: "Shopify stores built to sell",
    intro:
      "We design, build and optimise Shopify stores where brand, speed and conversion are planned from the first wireframe, so more of your visitors become customers.",
    offerings: [
      {
        title: "New Shopify store setup",
        desc: "Store setup, theme design, product and collection structure, payments, shipping and taxes, ready to launch.",
      },
      {
        title: "Theme customisation",
        desc: "Custom sections, landing pages and product templates that match your brand instead of a stock theme.",
      },
      {
        title: "Migration to Shopify",
        desc: "Move from WooCommerce, Wix or a custom site with products, customers and SEO redirects carried over.",
      },
      {
        title: "Apps & integrations",
        desc: "Reviews, subscriptions, WhatsApp, shipping, accounting and marketing tools connected and configured.",
      },
      {
        title: "Speed & Core Web Vitals",
        desc: "Leaner themes, optimised images and fewer scripts for faster pages and better search rankings.",
      },
      {
        title: "Conversion rate optimisation",
        desc: "Product pages, cart and checkout improvements, tested to lift orders and average order value.",
      },
    ],
    process: [
      { title: "Discover", desc: "We study your products, customers and competitors and agree the goals for the store." },
      { title: "Design", desc: "Wireframes and designs for the home, collection, product and cart pages." },
      { title: "Build", desc: "Theme development, apps, content and tracking set up and tested on every device." },
      { title: "Launch & grow", desc: "Go live, then keep improving speed and conversion with real store data." },
    ],
    faqs: [
      {
        q: "How long does it take to build a Shopify store?",
        a: "A standard store usually takes 2 to 4 weeks. Larger catalogues, custom features or migrations can take longer; we share a timeline after the first call.",
      },
      {
        q: "Can you redesign my existing Shopify store?",
        a: "Yes. We can refresh the design, rebuild key templates or improve speed and conversion without starting from scratch.",
      },
      {
        q: "Do you help after the store goes live?",
        a: "Yes. We offer ongoing support, updates, performance marketing and conversion optimisation for live stores.",
      },
    ],
  },
  {
    slug: "performance-marketing",
    name: "Performance Marketing",
    metaTitle: "Performance Marketing Agency: Google & Meta Ads",
    metaDescription:
      "Data-driven performance marketing by BuzingBee: Google Ads, Meta Ads, creatives, tracking and conversion optimisation, judged on leads and revenue, not clicks.",
    keywords: [
      "performance marketing agency",
      "google ads agency",
      "meta ads agency",
      "facebook ads agency",
      "ppc management services",
      "lead generation ads",
      "ecommerce ads agency",
    ],
    eyebrow: "Performance Marketing",
    heading: "Ads that bring leads and sales, not just clicks",
    intro:
      "Full-funnel campaigns on Google and Meta, planned around your margins and buying intent, with clear tracking so every rupee of spend can be traced to results.",
    offerings: [
      {
        title: "Google Ads",
        desc: "Search, Performance Max, Shopping and YouTube campaigns aimed at people already looking for you.",
      },
      {
        title: "Meta Ads",
        desc: "Facebook and Instagram campaigns for awareness, leads and sales, with audiences that keep improving.",
      },
      {
        title: "Creative strategy",
        desc: "Hooks, scripts, statics and UGC-style videos tested to find the messages that sell.",
      },
      {
        title: "Landing pages",
        desc: "Fast, focused pages built to turn ad clicks into enquiries and orders.",
      },
      {
        title: "Tracking & attribution",
        desc: "Pixels, conversion APIs and server-side tracking so reports match real leads and purchases.",
      },
      {
        title: "Reporting",
        desc: "Simple reports on cost per lead, ROAS and revenue, with the next steps we recommend.",
      },
    ],
    process: [
      { title: "Audit", desc: "We review your current ads, tracking, offers and landing pages." },
      { title: "Plan", desc: "Channels, budgets, audiences and creatives mapped to your targets." },
      { title: "Launch", desc: "Campaigns go live with tracking checked end to end." },
      { title: "Optimise & scale", desc: "Weekly testing of creatives, audiences and bids; budget moves to what works." },
    ],
    faqs: [
      {
        q: "What budget do I need to start running ads?",
        a: "It depends on your goals and market. We suggest a starting budget after the audit so there is enough data to learn and optimise.",
      },
      {
        q: "Which platforms do you manage?",
        a: "Mainly Google Ads (Search, Performance Max, Shopping, YouTube) and Meta Ads (Facebook and Instagram).",
      },
      {
        q: "How soon will I see results?",
        a: "Campaigns start collecting data from day one. Most accounts need a few weeks of testing before results become steady and scalable.",
      },
    ],
  },
  {
    slug: "ai-automation",
    name: "AI Automation",
    metaTitle: "AI Automation Services: AI Agents, Chatbots & WhatsApp",
    metaDescription:
      "BuzingBee builds AI agents, chatbots, WhatsApp automation and workflow automation that handle support, sales and operations 24/7, so you scale without extra headcount.",
    keywords: [
      "ai automation services",
      "ai agents for business",
      "ai chatbot development",
      "whatsapp automation",
      "whatsapp chatbot",
      "business process automation",
      "crm automation",
      "lead generation automation",
    ],
    eyebrow: "Automation Products & Services",
    heading: "AI agents and automation that work 24/7",
    intro:
      "We build AI agents, chatbots and automated workflows that answer customers, qualify leads and connect your tools, so your team spends time on work that needs people.",
    offerings: [
      {
        title: "AI agents",
        desc: "Agents that handle support questions, book appointments and follow up on leads, trained on your business.",
      },
      {
        title: "WhatsApp automation",
        desc: "Chatbots, broadcasts, order updates and lead capture on the WhatsApp Business API.",
      },
      {
        title: "Website chatbots",
        desc: "AI chat on your site that answers questions, captures enquiries and hands off to your team.",
      },
      {
        title: "Workflow automation",
        desc: "Forms, CRMs, sheets, email and payments connected so data moves without copy-paste.",
      },
      {
        title: "CRM & lead automation",
        desc: "Leads routed, scored and followed up automatically, with alerts for your sales team.",
      },
      {
        title: "Custom AI tools",
        desc: "Internal tools for documents, reports and content, built around how your team works.",
      },
    ],
    process: [
      { title: "Map", desc: "We find the repetitive tasks that cost your team the most time." },
      { title: "Design", desc: "Conversation flows, integrations and hand-off rules agreed with you." },
      { title: "Build", desc: "Agents and automations built, connected and tested with real scenarios." },
      { title: "Run & improve", desc: "We monitor results and keep improving answers and workflows." },
    ],
    faqs: [
      {
        q: "What can be automated in my business?",
        a: "Common starting points are customer support questions, lead capture and follow-up, appointment booking, order updates and moving data between tools.",
      },
      {
        q: "Do you work with the WhatsApp Business API?",
        a: "Yes. We set up WhatsApp Business API automation for chatbots, notifications and lead capture.",
      },
      {
        q: "Will the AI agent replace my team?",
        a: "No. It handles repetitive conversations and tasks, and hands complex or sensitive cases to your team.",
      },
    ],
  },
];

export const getServicePage = (slug: string) => SERVICE_PAGES.find((p) => p.slug === slug);
