import { toAbsoluteUrl } from "../config/site.js";

export const createBreadcrumbJsonLd = (items = []) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: toAbsoluteUrl(item.path || ""),
  })),
});

export const createCollectionPageJsonLd = ({ name, description, path, breadcrumbs }) => ({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      name,
      description,
      url: toAbsoluteUrl(path),
    },
    createBreadcrumbJsonLd(breadcrumbs),
  ],
});
