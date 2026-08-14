// WXR -> structured JSON content model.
//   node scripts/extract.mjs ../maintaintechnology.WordPress.2026-08-11.xml
// Writes content/*.json. Nothing here touches the network.

import fs from 'node:fs';
import path from 'node:path';
import { readWxr, phpUnserialize, json } from './lib/wxr.mjs';

const SRC = process.argv[2] || 'C:/Users/dalig/Downloads/maintaintechnology.WordPress.2026-08-11.xml';
const OUT = path.resolve('content');
fs.mkdirSync(OUT, { recursive: true });

const { site, posts } = readWxr(SRC);
const byId = new Map(posts.map((p) => [p.id, p]));

// --- asset URL rewriting ----------------------------------------------------
// Every wp-content/uploads URL becomes a local /assets/... path. We collect the
// mapping as we go so the downloader knows exactly what to fetch.
const assets = new Map(); // remoteUrl -> localPath

function localize(url) {
  if (typeof url !== 'string') return url;
  const m = url.match(/^https?:\/\/(?:www\.)?maintain\.com\.au\/wp-content\/uploads\/(.+?)(\?.*)?$/i);
  if (!m) return url;
  const local = '/assets/' + m[1];
  assets.set(url.split('?')[0], local);
  return local;
}

// Walk any structure and localize every string that looks like an uploads URL.
function localizeDeep(node) {
  if (typeof node === 'string') {
    return node.replace(
      /https?:\\?\/\\?\/(?:www\.)?maintain\.com\.au\\?\/wp-content\\?\/uploads\\?\/[^"'\s)\\]+/gi,
      (raw) => localize(raw.replace(/\\\//g, '/'))
    );
  }
  if (Array.isArray(node)) return node.map(localizeDeep);
  if (node && typeof node === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(node)) out[k] = localizeDeep(v);
    return out;
  }
  return node;
}

// --- Elementor tree ---------------------------------------------------------
const tree = (p) => localizeDeep(json(p.meta['_elementor_data'], []) || []);

// --- Design tokens from the Elementor kit ----------------------------------
function extractTokens() {
  const kit = posts.find((p) => p.meta['_elementor_template_type'] === 'kit');
  if (!kit) return { colors: {}, typography: {}, layout: {} };
  const k = phpUnserialize(kit.meta['_elementor_page_settings'] || '') || {};

  const colors = {};
  for (const c of [...(k.system_colors || []), ...(k.custom_colors || [])]) {
    if (c && c._id) colors[c._id] = { title: c.title || c._id, color: c.color };
  }

  const typography = {};
  for (const t of [...(k.system_typography || []), ...(k.custom_typography || [])]) {
    if (!t || !t._id) continue;
    typography[t._id] = {
      title: t.title || t._id,
      family: t.typography_font_family,
      weight: t.typography_font_weight,
      size: t.typography_font_size,
      lineHeight: t.typography_line_height,
      letterSpacing: t.typography_letter_spacing,
    };
  }

  return {
    colors,
    typography,
    layout: {
      containerWidth: k.container_width,
      spaceBetweenWidgets: k.space_between_widgets,
      breakpoints: k.viewport_md || k.viewport_lg ? { md: k.viewport_md, lg: k.viewport_lg } : undefined,
      body: {
        family: k.body_typography_font_family,
        size: k.body_typography_font_size,
        weight: k.body_typography_font_weight,
        lineHeight: k.body_typography_line_height,
      },
    },
    kitId: kit.id,
  };
}

// --- Custom fonts -----------------------------------------------------------
function extractFonts() {
  return posts
    .filter((p) => p.type === 'elementor_font')
    .map((p) => {
      const faces = phpUnserialize(p.meta['elementor_font_files'] || '') || [];
      return {
        family: p.title,
        faces: (Array.isArray(faces) ? faces : Object.values(faces))
          .map((f) => ({
            weight: f.font_weight || 'normal',
            style: f.font_style || 'normal',
            files: Object.fromEntries(
              ['woff2', 'woff', 'ttf', 'svg', 'eot']
                .map((fmt) => [fmt, f[fmt]?.url ? localize(f[fmt].url) : null])
                .filter(([, v]) => v)
            ),
          }))
          .filter((f) => Object.keys(f.files).length),
      };
    });
}

// --- JetEngine components (the React-component equivalents) -----------------
function extractComponents() {
  const out = {};
  for (const p of posts.filter((x) => x.type === 'jet-engine')) {
    const raw = phpUnserialize(p.meta['_component_props'] || '') || [];
    const list = Array.isArray(raw) ? raw : Object.values(raw);
    out[p.id] = {
      id: p.id,
      name: p.title,
      entryType: p.meta['_entry_type'] || 'component',
      props: list.map((c) => ({
        name: c.control_name,
        label: c.control_label,
        type: c.control_type || 'text',
        default: c.control_default_image
          ? localizeDeep(c.control_default_image)
          : c.control_default,
        options: c.control_options
          ? String(c.control_options).split('\n').filter(Boolean).map((o) => {
              const [value, label] = o.split('::');
              return { value, label: label ?? value };
            })
          : undefined,
      })),
      tree: tree(p),
      listing: p.meta['_listing_data'] ? phpUnserialize(p.meta['_listing_data']) : null,
      css: p.meta['_jet_engine_listing_css'] || '',
    };
  }
  return out;
}

// --- Elementor library: header / footer / popups / reusable sections --------
function extractTemplates() {
  const out = {};
  for (const p of posts.filter((x) => x.type === 'elementor_library')) {
    if (p.meta['_elementor_template_type'] === 'kit') continue;
    out[p.id] = {
      id: p.id,
      name: p.title,
      kind: p.meta['_elementor_template_type'] || 'section',
      tree: tree(p),
      settings: localizeDeep(json(p.meta['_elementor_page_settings'], {}) || {}),
      conditions: phpUnserialize(p.meta['_elementor_conditions'] || '') || null,
    };
  }
  return out;
}

// --- Navigation -------------------------------------------------------------
function extractNav() {
  const items = posts
    .filter((p) => p.type === 'nav_menu_item')
    .map((p) => {
      const objectType = p.meta['_menu_item_object'];
      const objectId = p.meta['_menu_item_object_id'];
      const target = objectType === 'custom' ? null : byId.get(objectId);
      return {
        id: p.id,
        parent: p.meta['_menu_item_menu_item_parent'] || '0',
        order: p.order,
        objectType,
        label: p.title || target?.title || '',
        url:
          objectType === 'custom'
            ? p.meta['_menu_item_url'] || '#'
            : target
              ? '/' + target.slug
              : '#',
      };
    })
    .sort((a, b) => a.order - b.order);

  // Nest by parent. Menu ids that point at themselves are top-level placeholders.
  const map = new Map(items.map((i) => [i.id, { ...i, children: [] }]));
  const roots = [];
  for (const item of map.values()) {
    const parent = map.get(item.parent);
    if (parent && parent.id !== item.id) parent.children.push(item);
    else roots.push(item);
  }
  return roots;
}

// --- Pages, posts, case studies --------------------------------------------
// Rank Math stores title templates, not finished titles: "%title% %sep% %sitename%".
// WordPress expands them at render time; nothing downstream of the export will,
// so we do it here.
function expandSeoTemplate(tpl, post) {
  if (!tpl || !tpl.includes('%')) return tpl;
  return tpl
    .replace(/%title%/g, post.title)
    .replace(/%sitename%/g, site.title)
    .replace(/%sitedesc%/g, site.description || '')
    .replace(/%sep%/g, '|')
    .replace(/%page%/g, '')
    .replace(/%excerpt%/g, (post.excerpt || '').replace(/<[^>]+>/g, '').trim())
    .replace(/%currentyear%/g, String(new Date().getFullYear()))
    .replace(/%[a-z_]+%/g, '')       // drop any template var we don't model
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*\|\s*$/, '')
    .trim();
}

const seo = (p) => ({
  title: expandSeoTemplate(p.meta['rank_math_title'], p) || p.title,
  description: expandSeoTemplate(p.meta['rank_math_description'], p) || '',
  ogImage: localize(p.meta['rank_math_facebook_image'] || '') || null,
});

function extractPages() {
  return posts
    .filter((p) => p.type === 'page')
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      status: p.status,
      template: p.meta['_wp_page_template'] || 'default',
      tree: tree(p),
      settings: localizeDeep(json(p.meta['_elementor_page_settings'], {}) || {}),
      seo: seo(p),
    }));
}

// Elementor also inlines each page's generated CSS into post_content. We render
// with the site's real stylesheets instead, but keep this as an offline fallback
// in case the origin disappears before anyone re-runs the asset fetch.
function writePageCss() {
  const dir = path.join(OUT, 'page-css');
  fs.mkdirSync(dir, { recursive: true });
  let n = 0;
  for (const p of posts) {
    const css = [...p.content.matchAll(/<style>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
    if (!css.trim()) continue;
    fs.writeFileSync(path.join(dir, `${p.type}-${p.id}-${p.slug || 'untitled'}.css`), css);
    n++;
  }
  return n;
}

function extractCaseStudies() {
  return posts
    .filter((p) => p.type === 'case-study')
    .map((p) => {
      const f = {};
      for (const [k, v] of Object.entries(p.meta)) {
        if (k.startsWith('cs_') || k === 'feature_image') f[k] = localizeDeep(v);
      }
      // Collapse the `foo_-_list_N` / `foo_-_phase_title_N` field families into arrays.
      const lists = {};
      for (const [k, v] of Object.entries(f)) {
        const m = k.match(/^(.*)_-_(list|phase_badge|phase_title|phase_description|title|description)_(\d+)$/);
        if (!m || !v) continue;
        const [, group, kind, n] = m;
        (lists[group] ||= {});
        (lists[group][n] ||= {});
        lists[group][n][kind] = v;
      }
      const grouped = {};
      for (const [group, byIndex] of Object.entries(lists)) {
        grouped[group] = Object.keys(byIndex)
          .sort((a, b) => a - b)
          .map((n) => byIndex[n])
          .filter((entry) => Object.values(entry).some(Boolean));
      }
      return {
        id: p.id,
        slug: p.slug,
        title: p.title,
        date: p.date,
        thumbnail: f.cs_thumbnail || f.feature_image || null,
        fields: f,
        groups: grouped,
        seo: seo(p),
      };
    });
}

function extractPosts() {
  return posts
    .filter((p) => p.type === 'post')
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      date: p.date,
      excerpt: p.excerpt,
      html: localizeDeep(p.content),
      thumbnail: localize(byId.get(p.meta['_thumbnail_id'])?.attachmentUrl || '') || null,
      seo: seo(p),
    }));
}

function extractNewsletters() {
  return posts
    .filter((p) => p.type === 'newsletter')
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      date: p.date,
      html: localizeDeep(p.content),
      fields: Object.fromEntries(
        Object.entries(p.meta).filter(([k]) => !k.startsWith('_') && !k.startsWith('rank_math'))
      ),
    }));
}

// --- Forms (Forminator) -----------------------------------------------------
function extractForms() {
  return posts
    .filter((p) => p.type === 'forminator_forms')
    .map((p) => {
      const data = phpUnserialize(p.meta['forminator_form_meta'] || '') || {};
      const fields = [];
      for (const w of data.fields || data.wrappers || []) {
        for (const fld of w.fields || [w]) {
          if (!fld || !fld.element_id) continue;
          const conditions = (fld.conditions || []).map((c) => ({
            field: c.element_id,
            rule: c.rule,          // is | is_not | contains | ...
            value: c.value,
          }));
          fields.push({
            id: fld.element_id,
            row: w.wrapper_id || null,
            type: fld.type || fld.element_id.split('-')[0],
            label: fld.field_label || '',
            placeholder: fld.placeholder || '',
            // Consent fields keep their (HTML) wording in a separate key —
            // it is the actual legal text shown next to the checkbox.
            description: fld.consent_description || fld.description || '',
            // Forminator writes 1 / "true" / true depending on field type.
            required: fld.required === 'true' || fld.required === true || fld.required === 1 || fld.required === '1',
            options:
              fld.options?.map((o) => ({
                label: o.label,
                value: o.value,
                // Forminator marks the pre-selected choice with default: "1".
                default: o.default === '1' || o.default === 1 || o.default === true,
              })) || undefined,
            // Show this field only when every condition holds.
            conditionAction: fld.condition_action || 'show',
            conditionRule: fld.condition_rule || 'all',
            conditions,
            fileTypes: fld.filetypes || undefined,
            uploadLimit: fld['upload-limit'] || undefined,
            fileSize: fld.filesize || undefined,
          });
        }
      }
      const s = data.settings || {};
      return {
        id: p.id,
        name: p.title,
        slug: p.slug,
        fields,
        thankYou: s['thankyou-message'] || 'Thank you for contacting us, we will be in touch shortly.',
        submitLabel: s['submit-button-text'] || 'Submit',
      };
    });
}

// --- Elementor Custom Code snippets -----------------------------------------
// These are injected into <head>/<body> on every page and are NOT part of any
// stylesheet. The "Master CTA Button" snippet alone carries ~22 kB of button
// and design-token CSS — without it the whole button system renders unstyled.
function extractSnippets() {
  return posts
    .filter((p) => p.type === 'elementor_snippet' && p.status === 'publish')
    .map((p) => {
      const code = localizeDeep(p.meta['_elementor_code'] || '');
      const css = [...code.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1]).join('\n');
      const js = [...code.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join('\n');
      const scriptSrcs = [...code.matchAll(/<script[^>]*\ssrc=["']([^"']+)["']/g)].map((m) => m[1]);
      return {
        id: p.id,
        title: p.title,
        location: p.meta['_elementor_location'] || 'elementor_head',
        priority: Number(p.meta['_elementor_priority'] || 10),
        conditions: phpUnserialize(p.meta['_elementor_conditions'] || '') || null,
        css,
        js,
        scriptSrcs,
      };
    })
    .sort((a, b) => a.priority - b.priority);
}

// --- Permalinks -------------------------------------------------------------
// `internal-url` dynamic tags reference posts by numeric id, so we need an
// id -> path map. Derived from each item's own <link>, which the export carries.
function extractPermalinks() {
  const map = {};
  for (const p of posts) {
    if (!p.link || !p.id) continue;
    if (['attachment', 'nav_menu_item', 'elementor_library', 'jet-engine'].includes(p.type)) continue;
    let pathname;
    try { pathname = new URL(p.link).pathname; } catch { continue; }
    pathname = pathname.replace(/\/$/, '') || '/';
    if (pathname === '/home') pathname = '/';
    map[p.id] = pathname;
  }
  return map;
}

// --- JetEngine Options Pages -------------------------------------------------
// These live in wp_options and are therefore ABSENT from any WXR export. The
// values below were recovered from the live site's rendered HTML (see
// scripts/probe-options.mjs). Edit here if they ever change.
const OPTIONS = {
  'company-information::contact-email': 'info@maintain.com.au',
  'company-information::phone_number': '+61414530836',
  'company-information::full_address': 'Brisbane, QLD 4000, AU',
  'company-information::x_formerly_twitter': 'http://www.linkedin.com/company/maintaintech',
  'company-information::appointment_link':
    'https://outlook.office365.com/book/MaintainTechConsultation@NETORG11337872.onmicrosoft.com/',
  // The contact page's form is injected through this option, so it holds the
  // shortcode itself rather than a bare id.
  'company-information::contact_form': '[forminator_form id="2539"]',
};

// Fail loudly if the templates start referencing a key we have no value for,
// rather than silently rendering an empty string.
function checkOptionCoverage() {
  const referenced = new Set();
  const haystack = JSON.stringify([model.templates, model.components, model.pages]);
  for (const m of haystack.matchAll(/"option_field":"([^"]+)"/g)) referenced.add(m[1]);
  for (const m of haystack.matchAll(/option_field%22%3A%22([^%]+)%22/g)) referenced.add(decodeURIComponent(m[1]));
  const missing = [...referenced].filter((k) => !(k in OPTIONS));
  if (missing.length) console.warn('  WARNING unmapped option keys:', missing.join(', '));
  return referenced.size;
}

// --- Write ------------------------------------------------------------------
const model = {
  site: { ...site, sourceUrl: site.url },
  tokens: extractTokens(),
  fonts: extractFonts(),
  nav: extractNav(),
  components: extractComponents(),
  templates: extractTemplates(),
  pages: extractPages(),
  caseStudies: extractCaseStudies(),
  posts: extractPosts(),
  newsletters: extractNewsletters(),
  forms: extractForms(),
};

// Attachments are collected last: localizeDeep populated `assets` along the way,
// but we also want every media item in the library even if unreferenced.
for (const a of posts.filter((p) => p.type === 'attachment')) {
  if (a.attachmentUrl) localize(a.attachmentUrl);
}

const write = (name, data) => {
  const file = path.join(OUT, name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return `${name} ${(fs.statSync(file).size / 1024).toFixed(0)}kb`;
};

const written = [
  write('site.json', {
    site: model.site,
    tokens: model.tokens,
    fonts: model.fonts,
    nav: model.nav,
    options: OPTIONS,
    permalinks: extractPermalinks(),
  }),
  write('components.json', model.components),
  write('templates.json', model.templates),
  write('pages.json', model.pages),
  write('case-studies.json', model.caseStudies),
  write('posts.json', model.posts),
  write('newsletters.json', model.newsletters),
  write('forms.json', model.forms),
  write('assets.json', Object.fromEntries([...assets].sort())),
  write('snippets.json', extractSnippets()),
];

const cssFiles = writePageCss();
const optionKeys = checkOptionCoverage();

// The dynamic-tag resolver needs options + permalinks, and it must be
// importable from plain Node (scripts/check.mjs) as well as from Next, so emit
// a real ES module rather than relying on JSON import attributes.
fs.writeFileSync(
  path.join(OUT, 'site-data.js'),
  '// GENERATED by scripts/extract.mjs - do not edit.\n' +
    `export const options = ${JSON.stringify(OPTIONS, null, 2)};\n\n` +
    `export const permalinks = ${JSON.stringify(extractPermalinks(), null, 2)};\n`
);

console.log('extracted ->', written.join(' | '));
console.log(`  page-css fallback: ${cssFiles} files | option keys referenced: ${optionKeys}`);
console.log(
  `  pages=${model.pages.length} caseStudies=${model.caseStudies.length} posts=${model.posts.length}` +
  ` newsletters=${model.newsletters.length} components=${Object.keys(model.components).length}` +
  ` templates=${Object.keys(model.templates).length} forms=${model.forms.length} assets=${assets.size}`
);
console.log(`  colors=${Object.keys(model.tokens.colors).length} typography=${Object.keys(model.tokens.typography).length} fonts=${model.fonts.length}`);
