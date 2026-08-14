import { publishedPages, rows } from '../lib/content.js';

const BASE = 'https://maintain.com.au';

export default function sitemap() {
  return [
    { url: `${BASE}/`, changeFrequency: 'weekly', priority: 1 },
    ...publishedPages
      .filter((p) => p.slug !== 'home')
      .map((p) => ({ url: `${BASE}/${p.slug}`, changeFrequency: 'monthly', priority: 0.8 })),
    ...rows.caseStudies.map((c) => ({ url: `${BASE}${c.url}`, changeFrequency: 'yearly', priority: 0.6 })),
    ...rows.newsletters.map((n) => ({
      url: `${BASE}${n.url}`,
      lastModified: n.date ? new Date(n.date + 'Z') : undefined,
      changeFrequency: 'yearly',
      priority: 0.5,
    })),
    ...rows.posts.map((p) => ({ url: `${BASE}${p.url}`, changeFrequency: 'yearly', priority: 0.5 })),
  ];
}
