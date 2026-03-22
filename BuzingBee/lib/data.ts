// ─── UNIFIED SERVICE CATEGORIES FOR TABS & HOMEPAGE ───
export const serviceCategories = [
  {
    id: "digital-marketing",
    label: "Digital Marketing",
    description:
      "These services focus on building brand authority and driving organic growth.",
    services: [
      {
        title: "Search Engine Optimization (SEO)",
        items: [
          "On-page, Off-page, and Technical SEO to improve search engine rankings.",
        ],
      },
      {
        title: "Content Marketing",
        items: [
          "Developing blogs, videos, and infographics to educate and attract customers.",
        ],
      },
      {
        title: "Social Media Marketing (SMM)",
        items: [
          "Managing platforms like Facebook, Instagram, LinkedIn, and TikTok to build communities.",
        ],
      },
      {
        title: "Email & SMS Marketing",
        items: [
          "Targeted automation for nurturing leads and customer retention.",
        ],
      },
      {
        title: "Influencer & Affiliate Marketing",
        items: ["Partnering with creators for performance-based promotion."],
      },
      {
        title: "Conversion Rate Optimization (CRO)",
        items: [
          "Using A/B testing to increase the percentage of users taking desired actions.",
        ],
      },
    ],
  },
  {
    id: "web-app-development",
    label: "Web & App Development",
    description:
      "These technical services provide the functional foundation for your digital presence.",
    services: [
      {
        title: "Website Development",
        items: [
          "Front-end, Back-end, and Full-stack development using various frameworks.",
        ],
      },
      {
        title: "Mobile App Development",
        items: [
          "Building native or cross-platform apps for iOS and Android using tools like Flutter or React Native.",
        ],
      },
      {
        title: "E-commerce Development",
        items: [
          "Specialized stores built on Shopify, Magento, or WooCommerce.",
        ],
      },
      {
        title: "Web Application Development",
        items: [
          "Creating complex SaaS platforms and internal business portals.",
        ],
      },
      {
        title: "API Development & Integration",
        items: [
          "Connecting different software systems for seamless data exchange.",
        ],
      },
    ],
  },
  {
    id: "advertising",
    label: "Advertising (Ads)",
    description:
      "Paid strategies designed for immediate visibility and rapid traffic.",
    services: [
      {
        title: "Search Engine Marketing (SEM/PPC)",
        items: [
          "Managing Google Ads and Bing Ads to appear at the top of search results.",
        ],
      },
      {
        title: "Social Media Advertising",
        items: [
          "Running Sponsored Posts, Carousel Ads, and Story Ads on Meta, LinkedIn, and TikTok.",
        ],
      },
      {
        title: "Display & Video Advertising",
        items: [
          "Placing banner ads across the Google Display Network and video ads on YouTube.",
        ],
      },
      {
        title: "Shopping Ads",
        items: [
          "Product Listing Ads (PLAs), specifically for e-commerce products.",
        ],
      },
      {
        title: "Retargeting Ads",
        items: [
          "Reconnecting with previous website visitors to encourage conversion.",
        ],
      },
    ],
  },
  {
    id: "ai-services",
    label: "AI (Artificial Intelligence)",
    description:
      "Next-generation services that use machine learning to automate and optimize marketing.",
    services: [
      {
        title: "AI-Powered SEO",
        items: [
          "Using tools to analyze search intent and predict trending keywords.",
        ],
      },
      {
        title: "AI Content Generation",
        items: [
          "Automating the creation of SEO-friendly copy, ad headlines, and visual assets.",
        ],
      },
      {
        title: "Predictive Analytics",
        items: [
          "Forecasting campaign performance and audience behavior before spending budget.",
        ],
      },
      {
        title: "AI Chatbots & Conversational Marketing",
        items: ["Providing 24/7 automated support and lead qualification."],
      },
      {
        title: "Automated Bidding",
        items: [
          "Using AI algorithms to adjust ad bids in real-time for maximum ROI.",
        ],
      },
    ],
  },
  {
    id: "geo-services",
    label: "GEO (Generative Engine & Local)",
    description:
      "Strategies focused on being found in 'AI answers' and location-specific searches.",
    services: [
      {
        title: "Generative Engine Optimization (GEO)",
        items: [
          "Optimizing brand visibility specifically for AI search results like Google's AI Overviews and LLM recommendations.",
        ],
      },
      {
        title: "Local SEO & GEO-Targeting",
        items: [
          "Optimizing Google Business Profiles and maps to attract local foot traffic.",
        ],
      },
      {
        title: "Location-Based Advertising",
        items: [
          "Running Local Search Ads that trigger when users are physically near a business.",
        ],
      },
      {
        title: "AEO (Answer Engine Optimization)",
        items: [
          "Structuring content to be the primary spoken or text answer for voice assistants and AI chatbots.",
        ],
      },
    ],
  },
];

/* ─── SERVICE PLANS (TAB VIEW) ─── */
export const servicePlansByCategory = [
  {
    id: "digital-marketing",
    label: "Digital Marketing",
    plans: [
      {
        name: "Starter",
        price: "₹14,999",
        period: "/month",
        description: "Best for local businesses starting digital growth.",
        features: [
          "SEO setup + keyword map",
          "8 social creatives / month",
          "Monthly performance report",
        ],
      },
      {
        name: "Growth",
        price: "₹29,999",
        period: "/month",
        description: "For businesses ready to scale leads consistently.",
        features: [
          "SEO + Content + SMM",
          "Ads optimization (Meta/Google)",
          "Bi-weekly strategy calls",
        ],
      },
      {
        name: "Scale",
        price: "Custom",
        period: "",
        description: "Omnichannel growth engine for aggressive scaling.",
        features: [
          "Full-funnel campaign management",
          "CRO + automation workflow",
          "Dedicated growth manager",
        ],
      },
    ],
  },
  {
    id: "web-app-development",
    label: "Web & App Development",
    plans: [
      {
        name: "MVP",
        price: "₹49,999",
        period: "starting",
        description: "Launch fast with a clean, focused product build.",
        features: [
          "UI/UX + core pages",
          "Performance-first codebase",
          "Deployment + QA included",
        ],
      },
      {
        name: "Business",
        price: "₹1,19,999",
        period: "starting",
        description: "Advanced website/app for serious business workflows.",
        features: [
          "Custom modules + dashboard",
          "API integrations",
          "Security + analytics setup",
        ],
      },
      {
        name: "Enterprise",
        price: "Custom",
        period: "",
        description: "Scalable architecture for high-volume operations.",
        features: [
          "Microservice-ready architecture",
          "Team augmentation",
          "Ongoing support SLA",
        ],
      },
    ],
  },
  {
    id: "advertising",
    label: "Advertising (Ads)",
    plans: [
      {
        name: "Test Budget",
        price: "₹19,999",
        period: "/month",
        description: "Validate your channel with controlled ad experiments.",
        features: [
          "Campaign setup + tracking",
          "Ad copy & creatives",
          "Weekly optimization",
        ],
      },
      {
        name: "Performance",
        price: "₹39,999",
        period: "/month",
        description: "Reliable lead flow with tighter CPA control.",
        features: [
          "Multi-campaign structure",
          "Audience retargeting",
          "Landing page recommendations",
        ],
      },
      {
        name: "Aggressive Scale",
        price: "Custom",
        period: "",
        description: "For brands optimizing at volume across channels.",
        features: [
          "Cross-platform budget strategy",
          "Real-time bid management",
          "Advanced reporting dashboard",
        ],
      },
    ],
  },
  {
    id: "ai-services",
    label: "AI Services",
    plans: [
      {
        name: "AI Starter",
        price: "₹24,999",
        period: "starting",
        description: "Quick wins using AI automation in your workflow.",
        features: [
          "AI audit + roadmap",
          "1 chatbot/use case setup",
          "Basic team handover",
        ],
      },
      {
        name: "AI Growth",
        price: "₹59,999",
        period: "starting",
        description: "AI-powered operations for higher efficiency and ROI.",
        features: [
          "Multiple automation flows",
          "Predictive analytics setup",
          "Integration with existing tools",
        ],
      },
      {
        name: "AI Custom",
        price: "Custom",
        period: "",
        description: "Custom AI implementation built for your business model.",
        features: [
          "Model strategy + deployment",
          "Security & governance support",
          "Continuous optimization",
        ],
      },
    ],
  },
  {
    id: "geo-services",
    label: "GEO & Local",
    plans: [
      {
        name: "Local Boost",
        price: "₹12,999",
        period: "/month",
        description: "Improve local visibility and map rankings quickly.",
        features: [
          "Google Business Profile optimization",
          "Local citations setup",
          "Review strategy",
        ],
      },
      {
        name: "Regional Growth",
        price: "₹27,999",
        period: "/month",
        description: "Scale from local to regional search dominance.",
        features: [
          "Location landing pages",
          "AEO + GEO optimization",
          "Local ad alignment",
        ],
      },
      {
        name: "Multi-Location",
        price: "Custom",
        period: "",
        description:
          "For multi-branch brands with location-heavy growth goals.",
        features: [
          "Multi-location SEO architecture",
          "Centralized reporting",
          "Dedicated strategist",
        ],
      },
    ],
  },
];
/* ─── STATS ─── */
export const stats = [
  { value: 261, suffix: "+", label: "Projects Delivered" },
  { value: 196, suffix: "+", label: "Happy Clients" },
  { value: 5, suffix: "+", label: "Years Experience" },
  { value: 98, suffix: "%", label: "Client Satisfaction" },
];

/* ─── SERVICES ─── */
export const services = [
  {
    id: "web-design",
    icon: "Globe",
    title: "Web Design & Development",
    description:
      "We build fast, responsive, and visually stunning websites that convert visitors into customers.",
    items: [
      "Responsive Web Design",
      "Front-End & Back-End Development",
      "Custom Web Portals",
      "UI/UX Wireframes & Prototyping",
      "CMS Development",
    ],
  },
  {
    id: "mobile-app",
    icon: "Smartphone",
    title: "Mobile App Development",
    description:
      "Native and cross-platform mobile apps that deliver seamless experiences on every device.",
    items: [
      "Android & iOS Development",
      "Cross-Platform (React Native / Flutter)",
      "UI/UX for Mobile",
      "App Store Deployment",
      "API Integration",
    ],
  },
  {
    id: "ai-ml",
    icon: "Brain",
    title: "AI & ML Development",
    description:
      "Leverage artificial intelligence and machine learning to automate, predict, and grow smarter.",
    items: [
      "Predictive Analytics",
      "Natural Language Processing",
      "AI Chatbots & Virtual Assistants",
      "Image & Voice Recognition",
      "ML Model Development",
    ],
  },
  {
    id: "custom-app",
    icon: "Code2",
    title: "Custom Application Development",
    description:
      "Tailor-made applications designed to solve your unique business challenges from day one.",
    items: [
      "MVP Development",
      "Progressive Web Apps (PWAs)",
      "UI/UX Design",
      "App Maintenance & Support",
      "App Modernization",
    ],
  },
  {
    id: "wordpress-shopify",
    icon: "ShoppingBag",
    title: "WordPress & Shopify Development",
    description:
      "Launch and scale your online presence with powerful WordPress and Shopify solutions.",
    items: [
      "Custom Theme Design",
      "WordPress Services",
      "WooCommerce Integration",
      "Shopify Store Setup",
      "Speed & Performance Optimization",
    ],
  },
  {
    id: "ecommerce",
    icon: "ShoppingCart",
    title: "E-Commerce Solutions",
    description:
      "End-to-end e-commerce platforms that drive sales, manage inventory, and delight customers.",
    items: [
      "Custom eCommerce Development",
      "eCommerce Mobile Apps",
      "Payment Gateway Integration",
      "Product & Inventory Management",
      "Multi-Vendor Marketplace",
    ],
  },
];

/* ─── DIGITAL MARKETING SERVICES ─── */
export const digitalMarketingServices = [
  {
    id: "seo",
    icon: "Search",
    title: "SEO Optimization",
    description:
      "Dominate search engine rankings with our proven on-page, off-page, and technical SEO strategies.",
    items: [
      "Keyword Research & Strategy",
      "On-Page SEO Optimization",
      "Technical SEO Audits",
      "Link Building & Outreach",
      "Local SEO & Google My Business",
    ],
  },
  {
    id: "social-media",
    icon: "Share2",
    title: "Social Media Marketing",
    description:
      "Build brand awareness and engage your audience across all major social platforms.",
    items: [
      "Social Media Strategy",
      "Content Creation & Scheduling",
      "Community Management",
      "Influencer Marketing",
      "Social Media Analytics",
    ],
  },
  {
    id: "ppc",
    icon: "Target",
    title: "Google & Meta Ads (PPC)",
    description:
      "Maximize your ROI with data-driven paid advertising campaigns across Google and Meta platforms.",
    items: [
      "Google Ads Campaigns",
      "Meta (Facebook & Instagram) Ads",
      "Remarketing & Retargeting",
      "A/B Testing & Optimization",
      "Campaign Analytics & Reporting",
    ],
  },
  {
    id: "email-marketing",
    icon: "Mail",
    title: "Email Marketing Campaigns",
    description:
      "Nurture leads and drive conversions with targeted, automated email marketing workflows.",
    items: [
      "Email Campaign Strategy",
      "Automated Drip Campaigns",
      "Newsletter Design & Management",
      "List Segmentation",
      "Performance Tracking",
    ],
  },
  {
    id: "content-marketing",
    icon: "FileText",
    title: "Content Marketing",
    description:
      "Attract, engage, and convert with high-quality content that tells your brand story.",
    items: [
      "Blog & Article Writing",
      "Video Content Production",
      "Infographic Design",
      "Content Strategy & Planning",
      "SEO Content Optimization",
    ],
  },
  {
    id: "branding",
    icon: "Palette",
    title: "Brand Identity & Logo Design",
    description:
      "Create a memorable brand identity that resonates with your audience and stands the test of time.",
    items: [
      "Logo Design & Brand Mark",
      "Brand Guidelines & Style Guide",
      "Business Card & Stationery",
      "Brand Strategy & Positioning",
      "Visual Identity System",
    ],
  },
];

/* ─── PROCESS STEPS ─── */
export const processSteps = [
  {
    step: 1,
    title: "Discovery",
    description:
      "We dive deep into your business goals, target audience, and competitive landscape.",
  },
  {
    step: 2,
    title: "Design",
    description:
      "Our designers craft stunning, user-centric interfaces that align with your brand identity.",
  },
  {
    step: 3,
    title: "Develop",
    description:
      "Our developers bring designs to life with clean, scalable, and high-performance code.",
  },
  {
    step: 4,
    title: "Deploy",
    description:
      "We launch your project with rigorous testing, optimization, and ongoing support.",
  },
];

/* ─── PRICING ─── */
export const pricingPlans = [
  {
    id: "basic",
    name: "Basic Plan",
    monthlyPrice: 9999,
    yearlyPrice: 49990,
    currency: "₹",
    description: "Perfect for small businesses and startups getting online.",
    featured: false,
    features: [
      "5 Pages Website",
      "1 Year Free Domain (.com .in .org)",
      "1 Year Free Cloud Hosting",
      "Dynamic Website (Premium Design)",
      "Admin Access",
      "Lifetime 24/7 Free Hosting Support",
      "Unlimited Images & Videos Upload",
      "Free SSL Certificate",
      "5 Free Email IDs",
      "SEO Friendly Website",
      "100% Responsive Website",
      "Live Chat Integration",
      "Payment Gateway Integration",
      "Social Media Integration",
      "Call Button Integration",
      "Google Maps Integration",
      "WhatsApp Chat Button",
      "Contact Form with Email Notification",
      "Google Analytics Integration",
      "Speed & Performance Optimization",
      "Cross-Browser Compatibility",
      "Blog / News Section",
      "Testimonials / Reviews Section",
    ],
  },
  {
    id: "standard",
    name: "Standard Plan",
    monthlyPrice: 9999,
    yearlyPrice: 99990,
    currency: "₹",
    description: "Best for growing businesses that need advanced features.",
    featured: true,
    features: [
      "Up to 15 Pages",
      "1 Year Free Domain (.com .in .org)",
      "1 Year Free Cloud Hosting",
      "Dynamic Website (Premium Design)",
      "Admin Access",
      "Lifetime 24/7 Free Hosting Support",
      "Unlimited Images & Videos Upload",
      "Free SSL Certificate",
      "10 Free Email IDs",
      "Advanced SEO (On-Page + Technical)",
      "100% Responsive Website",
      "Social Media Integration (All Platforms)",
      "Google & Meta Pixel Integration",
      "Custom Animations & Micro-interactions",
      "Multi-language Support",
      "Newsletter Subscription Integration",
      "Payment Gateway Integration",
      "Live Chat Integration",
      "Sitemap & Robots.txt",
      "Google Analytics Integration",
      "Speed & Performance Optimization",
      "Cross-Browser Compatibility",
      "Blog / News Section",
      "Testimonials / Reviews Section",
      "Priority Support (12hr Response)",
    ],
  },
  {
    id: "premium",
    name: "Premium Plan",
    monthlyPrice: 19999,
    yearlyPrice: 199990,
    currency: "₹",
    description: "For enterprises that demand maximum power and scalability.",
    featured: false,
    features: [
      "Unlimited Pages",
      "1 Year Free Domain (.com .in .org)",
      "1 Year Free Cloud Hosting",
      "E-Commerce Ready (WooCommerce/Shopify)",
      "Custom Admin Dashboard",
      "CRM Integration",
      "API Integrations (3rd Party)",
      "Advanced Analytics Dashboard",
      "Push Notification System",
      "Dedicated Project Manager",
      "1 Year Free Maintenance",
      "All Standard Plan Features Included",
      "Custom Animations & Micro-interactions",
      "Multi-language Support",
      "Newsletter Subscription Integration",
      "Google & Meta Pixel Integration",
      "Sitemap & Robots.txt",
      "6hr Priority Support",
    ],
  },
];

/* ─── TESTIMONIALS ─── */
export const testimonials = [
  {
    id: 1,
    name: "Ananya Sharma",
    company: "FreshCart India",
    avatar: "/images/avatar1.jpg",
    rating: 5,
    text: "BuzingBee transformed our online presence completely. Our e-commerce revenue grew 3x within six months of launching the new website. Their team is incredibly responsive and creative.",
  },
  {
    id: 2,
    name: "Rajiv Mehta",
    company: "TechNova Solutions",
    avatar: "/images/avatar2.jpg",
    rating: 5,
    text: "The AI chatbot they built for our SaaS platform reduced customer support tickets by 60%. BuzingBee truly understands the intersection of technology and marketing.",
  },
  {
    id: 3,
    name: "Priya Verma",
    company: "GreenLeaf Organics",
    avatar: "/images/avatar3.jpg",
    rating: 5,
    text: "From SEO to social media management, BuzingBee handles everything flawlessly. Our organic traffic has grown by 400% and we are now ranking on the first page of Google.",
  },
];

/* ─── PORTFOLIO ─── */
export const portfolioItems = [
  {
    id: 1,
    title: "FreshCart E-Commerce Platform",
    category: "E-Commerce",
    description:
      "A full-featured multi-vendor marketplace with payment integration and real-time inventory.",
    image: "/images/portfolio1.jpg",
  },
  {
    id: 2,
    title: "TechNova SaaS Dashboard",
    category: "Web Design",
    description:
      "A modern analytics dashboard with AI-powered insights and interactive data visualization.",
    image: "/images/portfolio2.jpg",
  },
  {
    id: 3,
    title: "GreenLeaf Mobile App",
    category: "Mobile Apps",
    description:
      "Cross-platform organic grocery delivery app with route optimization and live tracking.",
    image: "/images/portfolio3.jpg",
  },
  {
    id: 4,
    title: "Luxe Interiors Brand Identity",
    category: "Branding",
    description:
      "Complete brand identity for a luxury interior design firm including logo, stationery, and guidelines.",
    image: "/images/portfolio4.jpg",
  },
  {
    id: 5,
    title: "FinEdge Banking App",
    category: "Mobile Apps",
    description:
      "A secure fintech mobile application with biometric authentication and instant transfers.",
    image: "/images/portfolio5.jpg",
  },
  {
    id: 6,
    title: "StyleHub Fashion Store",
    category: "E-Commerce",
    description:
      "High-performance Shopify store with custom theme, AR try-on feature, and influencer integration.",
    image: "/images/portfolio6.jpg",
  },
];

export const portfolioCategories = [
  "All",
  "Web Design",
  "Mobile Apps",
  "E-Commerce",
  "Branding",
];

/* ─── BLOG POSTS ─── */
export const blogPosts = [
  {
    id: 1,
    title: "The Power of Digital Marketing in 2026",
    excerpt:
      "Discover how digital marketing strategies are evolving and what your business needs to stay ahead of the competition.",
    category: "Digital Marketing",
    date: "March 10, 2026",
    image: "/assets/image/services1.png",
    slug: "power-of-digital-marketing-2026",
  },
  {
    id: 2,
    title: "How AI is Revolutionizing Customer Experience",
    excerpt:
      "From chatbots to predictive analytics, learn how AI is transforming the way businesses interact with customers.",
    category: "AI & Technology",
    date: "March 5, 2026",
    image: "/assets/image/graphics.png",
    slug: "ai-revolutionizing-customer-experience",
  },
  {
    id: 3,
    title: "SEO Strategies That Actually Work in 2026",
    excerpt:
      "Forget outdated tactics. Here are the SEO strategies that are driving real organic growth this year.",
    category: "SEO",
    date: "February 28, 2026",
    image: "/assets/image/SEO.png",
    slug: "seo-strategies-2026",
  },
  {
    id: 4,
    title: "Building a High-Converting E-Commerce Store",
    excerpt:
      "Learn the essential design principles and technical foundations behind stores that actually convert browsers into buyers.",
    category: "E-Commerce",
    date: "February 20, 2026",
    image: "/assets/image/services2.jpg",
    slug: "high-converting-ecommerce-store",
  },
  {
    id: 5,
    title: "Why Every Business Needs a Mobile App",
    excerpt:
      "Mobile apps aren't just for big brands. Here's why a mobile app can be a game-changer for businesses of any size.",
    category: "Mobile Development",
    date: "February 15, 2026",
    image: "/assets/image/app.png",
    slug: "why-business-needs-mobile-app",
  },
  {
    id: 6,
    title: "Social Media Marketing: Trends to Watch",
    excerpt:
      "Stay on top of the latest social media trends that are shaping how brands connect with their audience online.",
    category: "Social Media",
    date: "February 8, 2026",
    image: "/assets/image/social1.png",
    slug: "social-media-marketing-trends",
  },
];
