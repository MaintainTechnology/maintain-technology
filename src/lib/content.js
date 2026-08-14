// Single entry point for the extracted content model.
// Everything is plain JSON on disk, so this is all static-import cheap.

import site from '../../content/site.json';
import componentsJson from '../../content/components.json';
import templatesJson from '../../content/templates.json';
import pagesJson from '../../content/pages.json';
import caseStudiesJson from '../../content/case-studies.json';
import postsJson from '../../content/posts.json';
import newslettersJson from '../../content/newsletters.json';
import formsJson from '../../content/forms.json';
import imagesJson from '../../content/images.json';

export const components = componentsJson;
export const templates = templatesJson;
export const pages = pagesJson;
export const caseStudies = caseStudiesJson;
export const posts = postsJson;
export const newsletters = newslettersJson;
export const forms = formsJson;
/** Responsive variants recovered from the live markup; see scripts/build-image-manifest.mjs */
export const images = imagesJson;
export const tokens = site.tokens;
export const fonts = site.fonts;
export const siteMeta = site.site;

/**
 * The nav export contains an abandoned stub menu alongside the live one.
 * The live menu is the one whose top-level items actually resolve somewhere —
 * either a real URL or children.
 */
export const nav = site.nav.filter((item) => item.children.length > 0 || (item.url && item.url !== '#'));

export const publishedPages = pages.filter((p) => p.status === 'publish');

export const pageBySlug = (slug) => pages.find((p) => p.slug === slug);
export const caseStudyBySlug = (slug) => caseStudies.find((c) => c.slug === slug);

/** Templates by their Elementor role. */
export const templateOfKind = (kind) => Object.values(templates).find((t) => t.kind === kind);
export const header = templateOfKind('header');
export const footer = templateOfKind('footer');
export const popup = templateOfKind('popup');
export const error404 = templateOfKind('error-404');
export const singleCaseStudy = Object.values(templates).find(
  (t) => t.kind === 'single-post' && /case stud/i.test(t.name)
);
export const singleNewsletter = Object.values(templates).find(
  (t) => t.kind === 'single-post' && /newsletter/i.test(t.name)
);

/**
 * Data behind each JetEngine listing grid, keyed by listing (component) id.
 * The listing's own `_listing_data.source`/`post_type` says what it queries;
 * these three are the only collections the site actually lists.
 */
// WordPress lists newest first; JetEngine inherits that default ordering.
const newestFirst = (a, b) => String(b.date || '').localeCompare(String(a.date || ''));

const caseStudyRows = caseStudies
  .map((c) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    date: c.date,
    url: `/case-study/${c.slug}`,
    thumbnail: c.thumbnail,
    excerpt: c.fields.cs_subtitle || c.fields.cs_content || '',
    fields: c.fields,
    groups: c.groups,
  }))
  .sort(newestFirst);

const newsletterRows = newsletters
  .map((n) => ({
    id: n.id,
    slug: n.slug,
    title: n.title,
    url: `/strikeforce-newsletter/${n.slug}`,
    date: n.date,
    html: n.html,
    thumbnail: n.fields.resource_thumbnail || null,
    // No WP excerpt on these: the card's post-excerpt tag is configured with
    // apply_to_post_content, so it derives from the body copy.
    excerpt: '',
    fields: n.fields,
  }))
  .sort(newestFirst);

const postRows = posts
  .map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    url: `/blog/${p.slug}`,
    date: p.date,
    thumbnail: p.thumbnail,
    excerpt: p.excerpt,
    html: p.html,
    fields: {},
  }))
  .sort(newestFirst);

export const listings = Object.fromEntries(
  Object.values(components)
    .filter((c) => c.entryType === 'listing')
    .map((c) => {
      const name = c.name.toLowerCase();
      if (name.includes('newsletter')) return [c.id, newsletterRows];
      if (name.includes('blog')) return [c.id, postRows];
      return [c.id, caseStudyRows]; // Card - Case Studies / Case Studies (PT) / Case Study
    })
);

export const rows = { caseStudies: caseStudyRows, newsletters: newsletterRows, posts: postRows };
