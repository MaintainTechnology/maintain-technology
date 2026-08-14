// Elementor layout tree -> React.
//
// The goal is byte-comparable markup with the live site, because the site's own
// generated CSS (src/styles/wp) is keyed on those exact classes and data-ids.
// Every shape here was read off the real rendered HTML in reference/html.

import { resolveSettings, isVisible, componentProps } from './props.js';
import { iconOf } from './svg.js';
import { components, templates, images } from '../content.js';
import HtmlWidget from '../../components/HtmlWidget.jsx';

const cx = (...parts) => parts.flat().filter(Boolean).join(' ');

/**
 * WordPress served resized variants with a srcset; the export only names the
 * originals. `content/images.json` (built from the live markup) restores the
 * variant set so we ship the same responsive images instead of full-size files.
 */
function imageVariants(url) {
  const entry = images[url];
  if (!entry) return { src: url };
  const rel = (r) => '/assets/' + r;
  return {
    src: entry.defaultRel ? rel(entry.defaultRel) : url,
    srcSet: entry.srcset?.length ? entry.srcset.map((s) => `${rel(s.rel)} ${s.w}w`).join(', ') : null,
    sizes: entry.sizes || (entry.width ? `(max-width: ${entry.width}px) 100vw, ${entry.width}px` : null),
    width: entry.width,
    height: entry.height,
  };
}

/** Elementor writes custom classes from the `_css_classes` setting. */
function customClasses(s) {
  return [s._css_classes, s.css_classes].filter(Boolean).join(' ').trim();
}

/** Elementor's "Attributes" control (`_attributes`): one `key|value` per line.
    These carry the animation hooks (`text-split`, `words-slide-from-right`,
    `data-index`…) that Effects.jsx keys off, so dropping them kills motion. */
function customAttrs(s) {
  const raw = s._attributes;
  if (!raw || typeof raw !== 'string') return null;
  const out = {};
  for (const line of raw.split(/\n+/)) {
    const [key, ...rest] = line.split('|');
    const k = key?.trim();
    if (!k || /^on/i.test(k) || !/^[a-z_][\w-]*$/i.test(k)) continue;
    out[k] = rest.join('|').trim();
  }
  return Object.keys(out).length ? out : null;
}

function widthClasses(s) {
  const out = [];
  if (s._element_width) out.push(`elementor-widget__width-${s._element_width}`);
  if (s._element_width_mobile) out.push(`elementor-widget-mobile__width-${s._element_width_mobile}`);
  if (s._element_width_tablet) out.push(`elementor-widget-tablet__width-${s._element_width_tablet}`);
  return out;
}

const jedvClass = (s) => (s.jedv_enabled === 'yes' ? 'jedv-enabled--yes' : null);

const html = (v) => ({ __html: v == null ? '' : String(v) });

/** Elementor link setting: { url, is_external, nofollow } */
function linkAttrs(link) {
  if (!link) return null;
  const url = typeof link === 'string' ? link : link.url;
  if (!url) return null;
  const a = { href: url };
  if (typeof link === 'object') {
    if (link.is_external) a.target = '_blank';
    if (link.nofollow) a.rel = 'nofollow';
    if (link.is_external && link.nofollow) a.rel = 'nofollow noopener';
    else if (link.is_external) a.rel = 'noopener';
  }
  return a;
}

function Icon({ icon, className }) {
  const i = iconOf(icon);
  if (!i) return null;
  if (i.svg) return <span className={className} dangerouslySetInnerHTML={html(i.svg)} />;
  if (i.img) return <span className={className}><img src={i.img} alt="" /></span>;
  return <span className={className}><i className={i.className} aria-hidden="true" /></span>;
}

// ---------------------------------------------------------------------------
// Widgets
// ---------------------------------------------------------------------------

const widgets = {
  heading(s) {
    const Tag = (s.header_size || 'h2').toLowerCase();
    const title = s.title ?? '';
    const link = linkAttrs(s.link);
    const cls = cx('elementor-heading-title', `elementor-size-${s.size || 'default'}`);
    // Elementor puts the anchor *inside* the title element, not around it.
    return link ? (
      <Tag className={cls}>
        <a {...link} dangerouslySetInnerHTML={html(title)} />
      </Tag>
    ) : (
      <Tag className={cls} dangerouslySetInnerHTML={html(title)} />
    );
  },

  'text-editor'(s) {
    return <div dangerouslySetInnerHTML={html(s.editor)} />;
  },

  image(s) {
    const img = s.image || {};
    if (!img.url) return null;
    const v = imageVariants(img.url);
    const size = s.image_size || 'large';
    const el = (
      <img
        src={v.src}
        {...(v.srcSet ? { srcSet: v.srcSet, sizes: v.sizes } : {})}
        {...(v.width ? { width: v.width, height: v.height } : {})}
        alt={img.alt || ''}
        className={cx(`attachment-${size}`, `size-${size}`, img.id ? `wp-image-${img.id}` : null)}
        loading="lazy"
        decoding="async"
      />
    );
    const link = linkAttrs(s.link_to === 'custom' ? s.link : null);
    return link ? <a {...link}>{el}</a> : el;
  },

  button(s) {
    const link = linkAttrs(s.link) || {};
    const icon = iconOf(s.selected_icon);
    const alignIcon = s.icon_align === 'row-reverse' || s.icon_align === 'right';
    const iconEl = icon ? (
      <span className="elementor-button-icon">
        {icon.svg ? (
          <span dangerouslySetInnerHTML={html(icon.svg)} />
        ) : icon.img ? (
          <img src={icon.img} alt="" />
        ) : (
          <i className={icon.className} aria-hidden="true" />
        )}
      </span>
    ) : null;

    return (
      <div className="elementor-button-wrapper">
        <a
          className={cx('elementor-button', link.href ? 'elementor-button-link' : null, `elementor-size-${s.size || 'sm'}`)}
          {...link}
          href={link.href || '#'}
        >
          <span className="elementor-button-content-wrapper">
            {!alignIcon && iconEl}
            <span className="elementor-button-text" dangerouslySetInnerHTML={html(s.text ?? '')} />
            {alignIcon && iconEl}
          </span>
        </a>
      </div>
    );
  },

  'icon-list'(s) {
    const items = s.icon_list || [];
    const inline = s.view === 'inline';
    return (
      <ul className={cx('elementor-icon-list-items', inline && 'elementor-inline-items')}>
        {items.map((it, i) => {
          const link = linkAttrs(it.link);
          const body = (
            <>
              <Icon icon={it.selected_icon} className="elementor-icon-list-icon" />
              <span className="elementor-icon-list-text" dangerouslySetInnerHTML={html(it.text ?? '')} />
            </>
          );
          return (
            <li key={it._id || i} className={cx('elementor-icon-list-item', inline && 'elementor-inline-item')}>
              {link ? <a {...link}>{body}</a> : body}
            </li>
          );
        })}
      </ul>
    );
  },

  'icon-box'(s) {
    const Title = (s.title_size || 'h3').toLowerCase();
    const link = linkAttrs(s.link);
    const icon = <Icon icon={s.selected_icon} className="elementor-icon" />;
    return (
      <div className="elementor-icon-box-wrapper">
        {icon && (
          <div className="elementor-icon-box-icon">
            {link ? <a className="elementor-icon" {...link}>{icon}</a> : icon}
          </div>
        )}
        <div className="elementor-icon-box-content">
          <Title className="elementor-icon-box-title">
            {link ? (
              <a {...link} dangerouslySetInnerHTML={html(s.title_text ?? '')} />
            ) : (
              <span dangerouslySetInnerHTML={html(s.title_text ?? '')} />
            )}
          </Title>
          {s.description_text ? (
            <p className="elementor-icon-box-description" dangerouslySetInnerHTML={html(s.description_text)} />
          ) : null}
        </div>
      </div>
    );
  },

  icon(s) {
    const link = linkAttrs(s.link);
    const i = iconOf(s.selected_icon);
    if (!i) return null;
    const inner = i.svg ? (
      <span dangerouslySetInnerHTML={html(i.svg)} />
    ) : i.img ? (
      <img src={i.img} alt="" />
    ) : (
      <i className={i.className} aria-hidden="true" />
    );
    return (
      <div className="elementor-icon-wrapper">
        {link ? (
          <a className="elementor-icon" {...link}>{inner}</a>
        ) : (
          <div className="elementor-icon">{inner}</div>
        )}
      </div>
    );
  },

  divider(s) {
    return (
      <div className="elementor-divider">
        <span className="elementor-divider-separator" />
      </div>
    );
  },

  html(s) {
    // Raw HTML blocks carry three things on this site: form shortcodes, vendor
    // <script> tags we've replaced, and genuine third-party embeds.
    // HtmlWidget sorts them out.
    return <HtmlWidget html={s.html} />;
  },

  spacer() {
    return <div className="elementor-spacer"><div className="elementor-spacer-inner" /></div>;
  },

  // --- theme widgets (single templates) ------------------------------------
  'theme-post-title'(s, ctx) {
    const Tag = (s.header_size || 'h1').toLowerCase();
    return <Tag className="elementor-heading-title elementor-size-default">{ctx.post?.title ?? ''}</Tag>;
  },
  'theme-post-excerpt'(s, ctx) {
    // `excerpt` is normally bound to a post-excerpt dynamic tag (already
    // resolved by this point); fall back to the post's own excerpt.
    return <div dangerouslySetInnerHTML={html(s.excerpt || ctx.post?.excerpt || '')} />;
  },
  'theme-post-content'(s, ctx) {
    return <div dangerouslySetInnerHTML={html(s.content || ctx.post?.html || '')} />;
  },
  'theme-post-featured-image'(s, ctx) {
    const url = ctx.post?.thumbnail;
    return url ? <img src={url} alt={ctx.post?.title || ''} className="attachment-full size-full" /> : null;
  },
  'post-info'(s, ctx) {
    const date = ctx.post?.date ? new Date(ctx.post.date + 'Z') : null;
    return (
      <ul className="elementor-inline-items elementor-icon-list-items elementor-post-info">
        {date && (
          <li className="elementor-icon-list-item elementor-repeater-item-date elementor-inline-item">
            <span className="elementor-icon-list-text elementor-post-info__item elementor-post-info__item--type-date">
              {date.toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </li>
        )}
      </ul>
    );
  },
  'post-navigation'(s, ctx) {
    const { prev, next } = ctx.siblings || {};
    return (
      <div className="elementor-post-navigation">
        <div className="elementor-post-navigation__prev elementor-post-navigation__link">
          {prev && <a href={prev.url}><span className="post-navigation__prev--label">Previous</span><span className="post-navigation__prev--title">{prev.title}</span></a>}
        </div>
        <div className="elementor-post-navigation__next elementor-post-navigation__link">
          {next && <a href={next.url}><span className="post-navigation__next--label">Next</span><span className="post-navigation__next--title">{next.title}</span></a>}
        </div>
      </div>
    );
  },
  'share-buttons'(s, ctx) {
    const url = ctx.post?.url ? `https://maintain.com.au${ctx.post.url}` : 'https://maintain.com.au';
    const nets = [
      ['linkedin', `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`],
      ['facebook', `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`],
      ['x-twitter', `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`],
    ];
    return (
      <div className="elementor-grid elementor-share-buttons">
        {nets.map(([name, href]) => (
          <div className="elementor-grid-item" key={name}>
            <a className={`elementor-share-btn elementor-share-btn_${name}`} href={href} target="_blank" rel="noopener noreferrer" aria-label={`Share on ${name}`}>
              <span className="elementor-share-btn__icon" />
            </a>
          </div>
        ))}
      </div>
    );
  },
};

// ---------------------------------------------------------------------------
// Composite widgets: template include, JetEngine component, listing grid
// ---------------------------------------------------------------------------

function TemplateWidget({ settings, ctx }) {
  const id = String(settings.template_id ?? '');
  const tpl = templates[id];
  if (!tpl) return null;
  return (
    <div className="elementor-template">
      <div
        className={cx('elementor', `elementor-${id}`)}
        data-elementor-type={tpl.kind}
        data-elementor-id={id}
        data-elementor-post-type="elementor_library"
      >
        {/* A template is its own Elementor document: depth resets, so its top
            containers are `e-parent`. Its CSS is scoped to `.elementor-{id}`. */}
        <Tree nodes={tpl.tree} ctx={{ ...ctx, props: {}, depth: 0 }} />
      </div>
    </div>
  );
}

function ComponentWidget({ componentId, settings, ctx, uid }) {
  const comp = components[componentId];
  if (!comp) return null;
  const props = componentProps(comp, settings);
  return (
    <div
      className={cx(
        'elementor',
        `elementor-${componentId}`,
        `jet-listing-grid--${componentId}`,
        `jet-component-instance-${uid}`
      )}
    >
      <Tree nodes={comp.tree} ctx={{ ...ctx, props, depth: 0 }} />
    </div>
  );
}

function ListingGrid({ settings, ctx }) {
  const listingId = String(settings.lisitng_id ?? settings.listing_id ?? '');
  const listing = components[listingId];
  const cols = settings.columns || 3;
  const colsT = settings.columns_tablet || cols;
  const colsM = settings.columns_mobile || 1;

  // Which collection this grid shows is declared on the listing itself.
  // JetEngine's default page size is 6 when `posts_num` is unset; rows arrive
  // newest-first, matching WordPress's default ordering.
  const source = ctx.listings?.[listingId] || [];
  const limit = Number(settings.posts_num) || 6;
  const rows = source.slice(0, limit);

  return (
    <div className="jet-listing-grid jet-listing">
      <div
        className={cx(
          'jet-listing-grid__items',
          `grid-col-desk-${cols}`,
          `grid-col-tablet-${colsT}`,
          `grid-col-mobile-${colsM}`,
          `jet-listing-grid--${listingId}`,
          settings.equal_columns_height === 'yes' && 'jet-equal-columns__wrapper',
          'grid-collapse-gap'
        )}
      >
        {rows.map((row, i) => (
          <div
            className={cx(
              'jet-listing-grid__item',
              `jet-listing-dynamic-post-${row.id}`,
              settings.equal_columns_height === 'yes' && 'jet-equal-columns'
            )}
            key={row.id || i}
            data-post-id={row.id}
          >
            {/* The card is its own Elementor document. Without this wrapper the
                listing's CSS — all scoped to `.elementor-{listingId}` — never
                matches, and the cards render unstyled. */}
            {listing ? (
              <div
                className={cx('elementor', `elementor-${listingId}`)}
                data-elementor-type="jet-listing-items"
                data-elementor-id={listingId}
                data-elementor-post-type="jet-engine"
              >
                <Tree nodes={listing.tree} ctx={{ ...ctx, post: row, props: {}, depth: 0 }} />
              </div>
            ) : null}
          </div>
        ))}
        {rows.length === 0 && <div className="jet-listing-not-found">No data was found</div>}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tree walk
// ---------------------------------------------------------------------------

function Container({ node, ctx }) {
  const s = resolveSettings(node.settings, ctx.props, ctx);
  if (!isVisible(s, ctx.props, ctx)) return null;

  const boxed = s.content_width !== 'full';
  const Tag = s.html_tag || 'div';
  // Elementor containers are either flex or CSS grid; the layout classes and
  // the generated CSS both key off which one.
  const layout = s.container_type === 'grid' ? 'e-grid' : 'e-flex';
  const className = cx(
    'elementor-element',
    `elementor-element-${node.id}`,
    !boxed && 'e-con-full',
    customClasses(s),
    jedvClass(s),
    layout,
    boxed && 'e-con-boxed',
    'e-con',
    ctx.depth ? 'e-child' : 'e-parent'
  );

  const link = linkAttrs(s.link);
  const kids = <Tree nodes={node.elements} ctx={{ ...ctx, depth: (ctx.depth || 0) + 1 }} />;

  return (
    <Tag
      className={className}
      data-id={node.id}
      data-element_type="container"
      data-e-type="container"
      {...(s._element_id ? { id: s._element_id } : {})}
      {...(customAttrs(s) || {})}
      {...(link ? { 'data-link': link.href } : {})}
    >
      {boxed ? <div className="e-con-inner">{kids}</div> : kids}
    </Tag>
  );
}

// The setting that carries a widget's visible content. When that setting is
// bound to a dynamic tag and the tag resolves to nothing, JetEngine drops the
// widget entirely rather than emitting an empty shell — so we do too.
const CONTENT_KEY = {
  heading: 'title',
  'text-editor': 'editor',
  image: 'image',
  button: 'text',
  'icon-box': 'title_text',
  icon: 'selected_icon',
};

function rendersNothing(type, node, resolved) {
  const key = CONTENT_KEY[type];
  if (!key) return false;
  // Only applies when the content was dynamic and the tag came back empty.
  // A statically empty widget is authored intent, and Elementor renders it.
  if (!node.settings?.__dynamic__?.[key]) return false;
  return resolved.__dynamicEmpty__?.includes(key) === true;
}

function Widget({ node, ctx }) {
  const type = node.widgetType || 'html';
  const s = resolveSettings(node.settings, ctx.props, ctx);
  if (!isVisible(s, ctx.props, ctx)) return null;
  if (rendersNothing(type, node, s)) return null;

  const extra = [];
  if (type === 'icon-list') {
    extra.push(`elementor-icon-list--layout-${s.view === 'inline' ? 'inline' : 'traditional'}`);
    extra.push('elementor-list-item-link-full_width');
  }
  if (type === 'icon') extra.push(`elementor-view-${s.view || 'default'}`);
  if (type === 'icon-box') {
    extra.push(`elementor-view-${s.view || 'default'}`);
    if (s.shape) extra.push(`elementor-shape-${s.shape}`);
    extra.push('elementor-position-block-start');
  }
  if (type === 'nav-menu') extra.push(`elementor-nav-menu--dropdown-${s.dropdown || 'none'}`);

  const className = cx(
    'elementor-element',
    `elementor-element-${node.id}`,
    widthClasses(s),
    customClasses(s),
    extra,
    jedvClass(s),
    'elementor-widget',
    `elementor-widget-${type}`
  );

  let body = null;
  const compMatch = type.match(/^jet-engine-component-(\d+)$/);
  if (compMatch) {
    body = <ComponentWidget componentId={compMatch[1]} settings={s} ctx={ctx} uid={node.id} />;
  } else if (type === 'template') {
    body = <TemplateWidget settings={s} ctx={ctx} />;
  } else if (type === 'jet-listing-grid') {
    body = <ListingGrid settings={s} ctx={ctx} />;
  } else if (type === 'nav-menu') {
    const NavMenu = ctx.NavMenu;
    body = NavMenu ? <NavMenu settings={s} id={node.id} /> : null;
  } else if (widgets[type]) {
    body = widgets[type](s, ctx);
  } else if (process.env.NODE_ENV !== 'production') {
    body = <div data-unimplemented-widget={type} />;
  }

  return (
    <div
      className={className}
      data-id={node.id}
      data-element_type="widget"
      data-e-type="widget"
      data-widget_type={`${type}.default`}
      {...(s._element_id ? { id: s._element_id } : {})}
      {...(customAttrs(s) || {})}
    >
      <div className="elementor-widget-container">{body}</div>
    </div>
  );
}

export function Tree({ nodes, ctx = {} }) {
  if (!Array.isArray(nodes)) return null;
  return nodes.map((node) =>
    node.elType === 'widget' ? (
      <Widget key={node.id} node={node} ctx={ctx} />
    ) : (
      <Container key={node.id} node={node} ctx={ctx} />
    )
  );
}

/** Top-level document wrapper: matches `<div class="elementor elementor-{id}">`. */
export function ElementorDocument({ id, tree, kind = 'wp-page', ctx = {}, className }) {
  return (
    <div
      className={cx('elementor', `elementor-${id}`, className)}
      data-elementor-type={kind}
      data-elementor-id={id}
      data-elementor-post-type={kind === 'wp-page' ? 'page' : 'elementor_library'}
    >
      <Tree nodes={tree} ctx={{ depth: 0, props: {}, ...ctx }} />
    </div>
  );
}
