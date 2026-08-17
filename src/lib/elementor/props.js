// Resolution of Elementor / JetEngine dynamic tags and dynamic-visibility rules.
//
// Settings that vary at render time are not stored inline. Instead the element
// carries a `__dynamic__` map of setting-name -> tag string:
//
//   "__dynamic__": { "title": "[elementor-tag id=".." name="jet-post-custom-field"
//                     settings="%7B%22meta_field%22%3A%22cs_title%22%7D"]" }
//
// Rendering therefore means walking the tree with two things in scope: the
// current JetEngine component props, and the current post.

// A generated ES module, not JSON: this file must import cleanly from plain
// Node (scripts/check.mjs) as well as from the Next build.
import { options, permalinks } from '../../../content/site-data.js';

const OPTIONS = options;
const PERMALINKS = permalinks;

const TAG_RE = /\[elementor-tag[^\]]*?name="([^"]+)"[^\]]*?settings="([^"]*)"[^\]]*\]/;

/** Parse one dynamic tag string -> { name, settings } or null. */
export function parseTag(value) {
  if (typeof value !== 'string') return null;
  const m = value.match(TAG_RE);
  if (!m) return null;
  let settings = {};
  try {
    settings = JSON.parse(decodeURIComponent(m[2]));
  } catch {
    /* malformed tag: treat as no settings */
  }
  return { name: m[1], settings };
}

const isEmpty = (v) =>
  v == null || v === '' || (typeof v === 'object' && !Array.isArray(v) && !v.url && !Object.keys(v).length);

/** Elementor wraps most tag output in optional before/after strings. */
function wrap(value, settings) {
  if (isEmpty(value)) return value;
  if (typeof value !== 'string') return value;
  return `${settings.before || ''}${value}${settings.after || ''}`;
}

function formatDate(settings) {
  const now = new Date();
  const fmt = settings.custom_format || 'Y';
  const out = fmt
    .replace(/Y/g, String(now.getFullYear()))
    .replace(/m/g, String(now.getMonth() + 1).padStart(2, '0'))
    .replace(/d/g, String(now.getDate()).padStart(2, '0'));
  return `${settings.before || ''}${out}${settings.after || ''}`;
}

const readingTime = (html) => {
  const words = String(html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

/**
 * Resolve a single dynamic tag.
 * Returns `undefined` when the tag family is unknown, so callers keep the
 * element's static value rather than blanking it.
 */
export function resolveTag(raw, props = {}, context = {}) {
  const tag = parseTag(raw);
  if (!tag) return undefined;
  const s = tag.settings || {};
  const post = context.post;

  let value;
  switch (tag.name) {
    // --- JetEngine component props ---------------------------------------
    case 'jet-component-tag':
    case 'jet-component-tag-image':
      value = props[s.control_name];
      break;

    // --- JetEngine post meta ----------------------------------------------
    case 'jet-post-custom-field':
      value = post?.fields?.[s.meta_field];
      break;
    case 'jet-post-custom-image': {
      const v = post?.fields?.[s.img_field];
      value = v ? (typeof v === 'string' ? { url: v } : v) : undefined;
      break;
    }

    // --- JetEngine Options Pages (recovered from the live site) ------------
    case 'jet-options-page':
      value = OPTIONS[s.option_field];
      break;

    // --- Post context ------------------------------------------------------
    case 'post-title':
      value = post?.title ?? context.page?.title;
      break;
    case 'page-title':
      value = context.page?.title ?? post?.title;
      break;
    case 'post-excerpt': {
      // `max_length` counts words, not characters, and `apply_to_post_content`
      // means "fall back to the body copy when there is no explicit excerpt".
      let text = String(post?.excerpt || '');
      if (!text.trim() && s.apply_to_post_content === 'yes') {
        text = String(post?.html || '').replace(/<[^>]+>/g, ' ');
      }
      text = text.replace(/\s+/g, ' ').trim();
      const max = Number(s.max_length);
      if (max > 0) {
        const words = text.split(' ');
        if (words.length > max) text = words.slice(0, max).join(' ');
        else return `${s.before || ''}${text}${text ? '' : ''}`;
      }
      value = text;
      break;
    }
    case 'post-url':
      value = post?.url;
      break;
    case 'post-date':
      value = post?.date ? new Date(post.date + 'Z').toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
      break;
    case 'post-featured-image':
      value = post?.thumbnail ? { url: post.thumbnail } : undefined;
      break;

    // --- Links --------------------------------------------------------------
    case 'internal-url':
      value = PERMALINKS[String(s.post_id)] || undefined;
      break;
    case 'site-url':
      value = '/';
      break;
    case 'popup':
      // Elementor emits an action URL; Effects.jsx listens for this instead.
      // Close-action tags carry no popup id — they close whatever is open.
      value = s.action === 'close' ? '#popup-close' : `#popup-${s.popup}`;
      break;

    // --- Misc ---------------------------------------------------------------
    case 'current-date-time':
      return formatDate(s);
    case 'shortcode':
      if (String(s.shortcode || '').includes('reading_time')) {
        return String(s.shortcode).replace('[reading_time]', String(readingTime(post?.html)));
      }
      value = '';
      break;

    default:
      return undefined;
  }

  if (isEmpty(value) && s.fallback !== undefined && !isEmpty(s.fallback)) return s.fallback;
  if (isEmpty(value)) return typeof value === 'object' ? undefined : '';
  return wrap(value, s);
}

/** Apply one resolved value, coercing to the shape that setting expects. */
function assign(target, key, resolved) {
  if (typeof resolved === 'string' && (key === 'link' || key.endsWith('_link'))) {
    target[key] = { ...(typeof target[key] === 'object' && target[key] ? target[key] : {}), url: resolved };
  } else if ((key === 'image' || key.endsWith('_image')) && typeof resolved === 'string') {
    target[key] = { url: resolved };
  } else {
    target[key] = resolved;
  }
}

/**
 * Settings object with every `__dynamic__` entry resolved — including those
 * nested inside repeater arrays. Icon-list rows, for instance, carry their own
 * `__dynamic__` per item, which is how the footer's contact details are bound.
 */
export function resolveSettings(settings, props = {}, context = {}) {
  if (!settings || typeof settings !== 'object') return settings ?? {};

  const resolveNode = (node) => {
    if (Array.isArray(node)) return node.map(resolveNode);
    if (!node || typeof node !== 'object') return node;

    let out = node;
    const dyn = node.__dynamic__;
    if (dyn) {
      out = { ...node };
      const emptied = [];
      for (const [key, raw] of Object.entries(dyn)) {
        const resolved = resolveTag(raw, props, context);
        if (resolved === undefined) continue;

        // A tag that resolves to nothing does NOT wipe the authored value:
        // JetEngine falls back to whatever the element already had. This is
        // what keeps a button's styling classes when the optional prop that
        // would override them is unset.
        if (isEmpty(resolved)) {
          emptied.push(key);
          if (!isEmpty(node[key])) continue;
        }
        assign(out, key, resolved);
      }
      delete out.__dynamic__;
      // Recorded so the renderer can drop widgets whose *content* was dynamic
      // and came back empty, rather than emitting a placeholder shell.
      if (emptied.length) out.__dynamicEmpty__ = emptied;
    }

    // Recurse into nested structures (repeaters, grouped controls).
    let changed = out !== node;
    const next = changed ? out : { ...node };
    for (const [k, v] of Object.entries(next)) {
      if (!v || typeof v !== 'object') continue;
      const r = resolveNode(v);
      if (r !== v) { next[k] = r; changed = true; }
    }
    return changed ? next : node;
  };

  return resolveNode(settings);
}

/**
 * JetEngine Dynamic Visibility. Failing elements are omitted from the output
 * entirely, which is what the live site does — this is what keeps empty
 * repeater slots (phase 5 of 5, etc.) from rendering.
 */
export function isVisible(settings, props = {}, context = {}) {
  if (settings?.jedv_enabled !== 'yes') return true;
  const conditions = settings.jedv_conditions || [];

  for (const cond of conditions) {
    let field = cond.jedv_field;
    const dynField = cond.__dynamic__?.jedv_field;
    if (dynField !== undefined) {
      const resolved = resolveTag(dynField, props, context);
      if (resolved !== undefined) field = resolved;
    }

    const expected = cond.jedv_value;
    const op = cond.jedv_condition || 'equal';
    const text = field == null ? '' : typeof field === 'object' ? (field.url || '') : String(field);
    const has = text.trim() !== '';

    let pass;
    switch (op) {
      case 'equal': pass = text === String(expected ?? ''); break;
      case 'not_equal': pass = text !== String(expected ?? ''); break;
      case 'contains': pass = text.includes(String(expected ?? '')); break;
      case 'not_contains': pass = !text.includes(String(expected ?? '')); break;
      // JetEngine writes `exists` for "field has a value" — the operator that
      // suppresses unused repeater slots (phase 5 of 5, list item 5 of 5).
      case 'exists': pass = has; break;
      case 'not_exists': pass = !has; break;
      case 'empty': pass = !has; break;
      case 'not_empty': pass = has; break;
      case 'greater': pass = Number(text) > Number(expected); break;
      case 'less': pass = Number(text) < Number(expected); break;
      default: pass = true;
    }
    if (!pass) return false;
  }
  return true;
}

// A JetEngine control_default on a text/textarea prop is editor placeholder
// copy ("Lorem ipsum...", "Card Title"), not a render-time fallback: on the
// front end an unset text prop renders empty, and the dynamic-visibility rules
// then hide the element. Defaults on structural controls (select, media) DO
// apply, because they choose a layout variant rather than supply content.
const STRUCTURAL = new Set(['select', 'choose', 'switcher', 'media']);

/** Prop bag for a component instance: schema defaults + instance overrides. */
export function componentProps(component, instanceSettings) {
  const bag = {};
  for (const p of component?.props || []) {
    if (!STRUCTURAL.has(p.type)) continue;
    if (p.type === 'media') {
      if (p.default && typeof p.default === 'object') bag[p.name] = p.default;
    } else if (p.default !== undefined && p.default !== 'Default Value') {
      bag[p.name] = p.default;
    }
  }
  for (const [k, v] of Object.entries(instanceSettings || {})) {
    if (k.startsWith('_') || k === 'jedv_conditions' || k === '__dynamic__') continue;
    if (v === '' || v === undefined) continue;
    bag[k] = v;
  }
  return bag;
}
