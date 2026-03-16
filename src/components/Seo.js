import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ensureMetaTag = (name) => {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  return el;
};

const ensureMetaPropertyTag = (property) => {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  return el;
};

const ensureLinkTag = (rel) => {
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  return el;
};

const ensureJsonLdScript = () => {
  let el = document.querySelector('script[data-seo-jsonld="true"]');
  if (!el) {
    el = document.createElement('script');
    el.type = 'application/ld+json';
    el.setAttribute('data-seo-jsonld', 'true');
    document.head.appendChild(el);
  }
  return el;
};

const Seo = ({ title, description, canonical, robots, jsonLd, meta }) => {
  const location = useLocation();

  useEffect(() => {
    if (title) document.title = title;

    if (description) {
      const meta = ensureMetaTag('description');
      meta.setAttribute('content', description);
    }

    if (robots) {
      const meta = ensureMetaTag('robots');
      meta.setAttribute('content', robots);
    }

    if (Array.isArray(meta)) {
      meta.forEach((m) => {
        if (!m) return;
        const content = m.content === undefined || m.content === null ? '' : String(m.content);
        if (m.name) {
          const el = ensureMetaTag(String(m.name));
          el.setAttribute('content', content);
          return;
        }
        if (m.property) {
          const el = ensureMetaPropertyTag(String(m.property));
          el.setAttribute('content', content);
        }
      });
    }

    const origin = typeof window !== 'undefined' && window.location ? window.location.origin : 'https://eltok.kz';
    const canonicalUrl = canonical || `${origin}${location.pathname}`;
    if (canonicalUrl) {
      const link = ensureLinkTag('canonical');
      link.setAttribute('href', canonicalUrl);
    }

    const script = ensureJsonLdScript();
    if (!jsonLd) {
      script.textContent = '';
    } else if (typeof jsonLd === 'string') {
      const raw = String(jsonLd).trim();
      const extracted = raw
        .replace(/^\s*<script[^>]*application\/ld\+json[^>]*>\s*/i, '')
        .replace(/^\s*<script[^>]*>\s*/i, '')
        .replace(/\s*<\/script>\s*$/i, '')
        .trim();
      script.textContent = extracted;
    } else {
      script.textContent = JSON.stringify(jsonLd);
    }
  }, [title, description, canonical, robots, jsonLd, meta, location.pathname]);

  return null;
};

export default Seo;
