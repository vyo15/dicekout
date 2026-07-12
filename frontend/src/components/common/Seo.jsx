import { useEffect } from "react";
import { SITE, toAbsoluteUrl } from "../../config/site";

const ensureMeta = (selector, attributes) => {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
};

const ensureCanonical = (href) => {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
};

const replaceJsonLd = (data) => {
  const id = "dicekout-jsonld";
  document.getElementById(id)?.remove();
  if (!data) return;
  const script = document.createElement("script");
  script.id = id;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
};

const Seo = ({
  title,
  description = SITE.description,
  path = "",
  image = SITE.defaultOgImage,
  type = "website",
  noindex = !SITE.allowIndexing,
  jsonLd = null,
}) => {
  useEffect(() => {
    const resolvedTitle = title || SITE.title;
    const canonical = toAbsoluteUrl(path);
    const imageUrl = toAbsoluteUrl(image);
    const robots = noindex ? "noindex,nofollow" : "index,follow";

    document.title = resolvedTitle;
    ensureCanonical(canonical);
    ensureMeta('meta[name="description"]', { name: "description", content: description });
    ensureMeta('meta[name="robots"]', { name: "robots", content: robots });
    ensureMeta('meta[property="og:type"]', { property: "og:type", content: type });
    ensureMeta('meta[property="og:title"]', { property: "og:title", content: resolvedTitle });
    ensureMeta('meta[property="og:description"]', { property: "og:description", content: description });
    ensureMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    ensureMeta('meta[property="og:image"]', { property: "og:image", content: imageUrl });
    ensureMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    ensureMeta('meta[name="twitter:title"]', { name: "twitter:title", content: resolvedTitle });
    ensureMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    ensureMeta('meta[name="twitter:image"]', { name: "twitter:image", content: imageUrl });
    replaceJsonLd(jsonLd);

    return () => {
      document.getElementById("dicekout-jsonld")?.remove();
    };
  }, [description, image, jsonLd, noindex, path, title, type]);

  return null;
};

export default Seo;
