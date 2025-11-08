// src/data/logoData.ts
export type LogoItem = {
  id: string;
  // primary image fields (some data uses `src`, others `logo`/`logoUrl`)
  src?: string; // path under /public/images/
  logo?: string;
  logoUrl?: string;

  // textual fields
  title?: string;
  clientName?: string;
  body?: string;
  description?: string;
  blogSlug?: string;
};

const logoData: LogoItem[] = [
  {
    id: "c01",
    src: "/images/Variant2-1.png",
    logo: "/images/Variant2-1.png",
    clientName: "Teens Lifestyle",
    title: "Teens Lifestyle",
    body:
      "Teens Lifestyle is a youth-focused apparel label. Medigital supported Teens Lifestyle with responsive e-commerce design, product photography coordination, and a social-first digital marketing strategy aimed at driving direct-to-consumer sales and growing social engagement among younger audiences.",
  },
  {
    id: "c02",
    src: "/images/Variant2-2.png",
    logo: "/images/Variant2-2.png",
    clientName: "Valath Jewellers",
    title: "Valath Jewellers",
    body:
      "Valath Jewellers is a traditional jewellery retailer. Medigital collaborated on a brand refresh, high-conversion product pages, SEO for local searches, and visual merchandising templates for in-store and digital campaigns to improve discoverability and online enquiries.",
  },
  {
    id: "c03",
    src: "/images/Variant2-3.png",
    logo: "/images/Variant2-3.png",
    clientName: "Fruitomans",
    title: "Fruitomans",
    body:
      "Fruitomans operates in food packaging and distribution. Medigital delivered a modern brochure website, packaging artwork guidance, and B2B lead generation campaigns using targeted search and display ads to help increase distributor enquiries and trade partnerships.",
  },
  {
    id: "c04",
    src: "/images/Variant2-4.png",
    logo: "/images/Variant2-4.png",
    clientName: "NeckFlix",
    title: "NeckFlix",
    body:
      "NeckFlix is a niche lifestyle/accessory brand. Medigital provided product catalogue UI/UX, conversion-optimised landing pages, and multi-channel campaigns (paid social + email) to raise product awareness and improve online conversion rates.",
  },
  {
    id: "c05",
    src: "/images/Variant2-5.png",
    logo: "/images/Variant2-5.png",
    clientName: "N'Style Home Wear",
    title: "N'Style Home Wear",
    body:
      "N'Style Home Wear focuses on comfortable home clothing and linens. Medigital implemented an e-commerce platform with improved product filtering, lifestyle photography direction, CRO experiments, and influencer-led social campaigns to boost seasonal sales.",
  },
  {
    id: "c06",
    src: "/images/Variant2-6.png",
    logo: "/images/Variant2-6.png",
    clientName: "Bhima & Brothers",
    title: "Bhima & Brothers",
    body:
      "Bhima & Brothers is an established retail brand. Medigital worked on omni-channel design — integrating POS creative, hero product pages and local SEO — and rolled out targeted promotions to increase footfall and online enquiries.",
  },
  {
    id: "c07",
    src: "/images/Variant2-7.png",
    logo: "/images/Variant2-7.png",
    clientName: "Odyssia",
    title: "Odyssia",
    body:
      "Odyssia is a lifestyle and leisure brand. Medigital supported Odyssia with brand identity assets, campaign microsites, and data-driven paid campaigns focused on driving lead generation and enhancing brand recall across regional markets.",
  },
  {
    id: "c08",
    src: "/images/Variant2-8.png",
    logo: "/images/Variant2-8.png",
    clientName: "Richmax Tours & Travels",
    title: "Richmax Tours & Travels",
    body:
      "Richmax Tours & Travels is a travel services provider. Medigital created a mobile-first booking funnel, email automation for leads, and performance marketing programs to capture seasonal bookings and travel enquiries.",
  },
  {
    id: "c09",
    src: "/images/Variant2-9.png",
    logo: "/images/Variant2-9.png",
    clientName: "Popees Baby Care",
    title: "Popees Baby Care",
    body:
      "Popees is a baby care products brand. Medigital supported product landing pages, on-site UX for parents (quick cart + subscription flows), ASO guidance for product apps, and family-focused campaign creative for social channels.",
  },
  {
    id: "c10",
    src: "/images/Variant2-10.png",
    logo: "/images/Variant2-10.png",
    clientName: "Euro Guard",
    title: "Euro Guard",
    body:
      "Euro Guard supplies UPVC and rainwater solutions. Medigital delivered an industry website with product configurators, downloadable spec sheets, and a targeted LinkedIn & search campaign to reach architects, contractors and trade buyers.",
  },
  {
    id: "c11",
    src: "/images/Variant2-11.png",
    logo: "/images/Variant2-11.png",
    clientName: "Kairali TMT",
    title: "Kairali TMT",
    body:
      "Kairali TMT manufactures steel reinforcement bars. Medigital provided corporate website modernization, technical datasheet layout, dealer portal UX recommendations, and targeted trade marketing assets to support channel partners.",
  },
  {
    id: "c12",
    src: "/images/Variant2-12.png",
    logo: "/images/Variant2-12.png",
    clientName: "EatToFresh",
    title: "EatToFresh",
    body:
      "EatToFresh produces ready-to-eat and fresh food solutions. Medigital designed a direct-to-consumer storefront, set up subscription ordering flows, and ran performance ads and conversion optimisation to lift orders and repeat purchase rates.",
  },
  {
    id: "c13",
    src: "/images/Variant2-13.png",
    logo: "/images/Variant2-13.png",
    clientName: "Swayamvara Silks",
    title: "Swayamvara Silks",
    body:
      "Swayamvara Silks is a premium textile & saree retailer. Medigital created a luxury-focused product gallery, curated content for seasonal campaigns, and an email lifecycle program aimed at VIP customers and festival season conversions.",
  },
  {
    id: "c14",
    src: "/images/Variant2-14.png",
    logo: "/images/Variant2-14.png",
    clientName: "Jayalakshmi",
    title: "Jayalakshmi",
    body:
      "Jayalakshmi is a heritage apparel and retail brand. Medigital worked on digital catalogues, UX improvements for product discovery, and POS creative that matches the in-store branding to provide a cohesive customer experience.",
  },
  {
    id: "c15",
    src: "/images/Variant2-15.png",
    logo: "/images/Variant2-15.png",
    clientName: "Chicking",
    title: "Chicking",
    body:
      "Chicking is an international quick-service restaurant brand. Medigital provided menu micro-site design, promotional campaign creative, and social & local ads execution to increase delivery and dine-in orders during key promotional windows.",
  },
  {
    id: "c16",
    src: "/images/Variant2-16.png",
    logo: "/images/Variant2-16.png",
    clientName: "KSFE",
    title: "KSFE",
    body:
      "KSFE (Kerala State Financial Enterprises) is a financial services organisation. Medigital helped produce secure informational web pages, customer education content, and accessibility-focused UX patterns to improve citizen engagement and clarity of services.",
  },
  {
    id: "c17",
    src: "/images/Variant2-17.png",
    logo: "/images/Variant2-17.png",
    clientName: "Swarnam Jewellery",
    title: "Swarnam Jewellery",
    body:
      "Swarnam Jewellery specialises in traditional jewellery collections. Medigital supported Swarnam with product storytelling, high-resolution imagery handling, campaign landing pages for festive seasons, and CRM-driven retention programs.",
  },
  {
    id: "c18",
    src: "/images/Variant2-18.png",
    logo: "/images/Variant2-18.png",
    clientName: "Mercely’s Ice Cream",
    title: "Mercely’s Ice Cream",
    body:
      "Mercely’s is an ice cream & dessert brand. Medigital designed seasonal promotional campaigns, POS creatives for in-store displays, and social media content to amplify new flavour launches and retail distribution announcements.",
  },
  {
    id: "c19",
    src: "/images/Variant2-19.png",
    logo: "/images/Variant2-19.png",
    clientName: "Suntips",
    title: "Suntips",
    body:
      "Suntips is a premium beverage/tea brand. Medigital created product landing pages, packaging mockups for e-commerce display, and influencer-driven sampling campaigns to boost trial and brand awareness in the target market.",
  },
  {
    id: "c20",
    src: "/images/Variant2-20.png",
    logo: "/images/Variant2-20.png",
    clientName: "Teens (alternate) / Brand Suite",
    title: "Teens (alternate) / Brand Suite",
    body:
      "A compact visual identity used across youth & lifestyle properties. Medigital produced a brand suite and templated creative that helps multiple sub-brands maintain a consistent design language across web and retail touchpoints.",
  },
];

export default logoData;
