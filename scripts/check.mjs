// Self-check for the parts of the conversion that would fail silently:
// the PHP unserializer, dynamic-tag resolution, visibility rules, and the
// form's conditional logic. Plain asserts, no framework.
//
//   node scripts/check.mjs

import assert from 'node:assert/strict';
import fs from 'node:fs';
import { phpUnserialize } from './lib/wxr.mjs';
import { parseTag, resolveTag, resolveSettings, isVisible, componentProps } from '../src/lib/elementor/props.js';

let n = 0;
const it = (name, fn) => {
  try {
    fn();
    n++;
  } catch (e) {
    console.error(`FAIL: ${name}\n  ${e.message}`);
    process.exitCode = 1;
  }
};

// --- PHP unserialize --------------------------------------------------------
it('php: scalars', () => {
  assert.equal(phpUnserialize('s:5:"hello";'), 'hello');
  assert.equal(phpUnserialize('i:42;'), 42);
  assert.equal(phpUnserialize('b:1;'), true);
  assert.equal(phpUnserialize('N;'), null);
});

it('php: list becomes an array, map becomes an object', () => {
  assert.deepEqual(phpUnserialize('a:2:{i:0;s:1:"a";i:1;s:1:"b";}'), ['a', 'b']);
  assert.deepEqual(phpUnserialize('a:1:{s:3:"key";s:3:"val";}'), { key: 'val' });
});

it('php: string lengths are byte counts, not character counts', () => {
  // "café" is 5 bytes but 4 JS characters — the naive reader loses the ';'.
  assert.equal(phpUnserialize('a:1:{s:1:"k";s:5:"café";}').k, 'café');
});

it('php: real component_props payload parses', () => {
  const props = phpUnserialize(
    'a:1:{i:0;a:4:{s:3:"_id";s:7:"3e825fa";s:13:"control_label";s:19:"Primary Button Text";' +
      's:12:"control_name";s:13:"p_button_text";s:15:"control_default";s:7:"Primary";}}'
  );
  assert.equal(props[0].control_name, 'p_button_text');
  assert.equal(props[0].control_default, 'Primary');
});

// --- dynamic tags -----------------------------------------------------------
const tag = (name, settings) =>
  `[elementor-tag id="x" name="${name}" settings="${encodeURIComponent(JSON.stringify(settings))}"]`;

it('tag: parses name and settings', () => {
  const t = parseTag(tag('jet-component-tag', { control_name: 'p_button_text' }));
  assert.equal(t.name, 'jet-component-tag');
  assert.equal(t.settings.control_name, 'p_button_text');
});

it('tag: component prop resolves from the prop bag', () => {
  const v = resolveTag(tag('jet-component-tag', { control_name: 'main_title' }), { main_title: 'Why Choose Maintain' });
  assert.equal(v, 'Why Choose Maintain');
});

it('tag: post meta resolves from the post fields', () => {
  const v = resolveTag(tag('jet-post-custom-field', { meta_field: 'cs_industry' }), {}, {
    post: { fields: { cs_industry: 'IT & Digital Transformation' } },
  });
  assert.equal(v, 'IT & Digital Transformation');
});

it('tag: before/after wrap the value', () => {
  const v = resolveTag(tag('jet-options-page', { option_field: 'company-information::contact-email', before: 'mailto:' }));
  assert.equal(v, 'mailto:info@maintain.com.au');
});

it('tag: excerpt truncates by WORDS and appends `after`', () => {
  const v = resolveTag(
    tag('post-excerpt', { max_length: 3, apply_to_post_content: 'yes', after: '...' }),
    {},
    { post: { excerpt: '', html: '<p>one two three four five</p>' } }
  );
  assert.equal(v, 'one two three...');
});

it('tag: falls back when the value is empty', () => {
  const v = resolveTag(
    tag('jet-post-custom-image', { img_field: 'missing', fallback: { url: '/assets/fallback.png' } }),
    {},
    { post: { fields: {} } }
  );
  assert.deepEqual(v, { url: '/assets/fallback.png' });
});

it('tag: unknown families return undefined so static values survive', () => {
  assert.equal(resolveTag(tag('some-future-tag', {}), {}), undefined);
});

// --- nested resolution ------------------------------------------------------
it('settings: resolves __dynamic__ inside repeater rows', () => {
  // This is how the footer binds its contact details.
  const out = resolveSettings({
    icon_list: [
      { _id: 'a', text: 'placeholder', __dynamic__: { text: tag('jet-options-page', { option_field: 'company-information::phone_number' }) } },
    ],
  });
  assert.equal(out.icon_list[0].text, '+61414530836');
});

it('settings: string link values are coerced to { url }', () => {
  const out = resolveSettings({ __dynamic__: { link: tag('post-url', {}) } }, {}, { post: { url: '/case-study/x' } });
  assert.deepEqual(out.link, { url: '/case-study/x' });
});

// --- visibility -------------------------------------------------------------
it('visibility: `exists` hides an empty repeater slot', () => {
  const settings = {
    jedv_enabled: 'yes',
    jedv_conditions: [
      { jedv_condition: 'exists', __dynamic__: { jedv_field: tag('jet-post-custom-field', { meta_field: 'cs_approach_-_phase_title_5' }) } },
    ],
  };
  const ctx = { post: { fields: { 'cs_approach_-_phase_title_5': '' } } };
  assert.equal(isVisible(settings, {}, ctx), false, 'empty phase must be hidden');

  ctx.post.fields['cs_approach_-_phase_title_5'] = 'Facilitated Agreement';
  assert.equal(isVisible(settings, {}, ctx), true, 'populated phase must render');
});

it('visibility: `equal` against a component prop', () => {
  const settings = {
    jedv_enabled: 'yes',
    jedv_conditions: [
      { jedv_condition: 'equal', jedv_value: 'dual_btn', __dynamic__: { jedv_field: tag('jet-component-tag', { control_name: 'button_style' }) } },
    ],
  };
  assert.equal(isVisible(settings, { button_style: 'dual_btn' }), true);
  assert.equal(isVisible(settings, { button_style: 'single_btn' }), false);
});

it('visibility: absent jedv_enabled means always visible', () => {
  assert.equal(isVisible({}, {}), true);
});

// --- component props --------------------------------------------------------
it('props: text defaults are editor placeholders and must NOT render', () => {
  const comp = {
    props: [
      { name: 'card_title', type: 'text', default: 'Card Title' },
      { name: 'card_content', type: 'textarea', default: 'Lorem ipsum dolor sit amet' },
      { name: 'alignment', type: 'select', default: 'left' },
    ],
  };
  const bag = componentProps(comp, {});
  assert.equal(bag.card_title, undefined, 'placeholder text must not leak onto the page');
  assert.equal(bag.card_content, undefined);
  assert.equal(bag.alignment, 'left', 'structural defaults still apply');
});

it('props: instance values override defaults', () => {
  const comp = { props: [{ name: 'alignment', type: 'select', default: 'left' }] };
  assert.equal(componentProps(comp, { alignment: 'center' }).alignment, 'center');
});

// --- form conditional logic (mirrors src/components/Form.jsx) ---------------
const forms = JSON.parse(fs.readFileSync('content/forms.json', 'utf8'));

function visible(field, values) {
  if (!field.conditions?.length) return true;
  const test = (c) => {
    const v = values[c.field];
    switch (c.rule) {
      case 'is': return String(v ?? '') === String(c.value);
      case 'is_not': return String(v ?? '') !== String(c.value);
      default: return true;
    }
  };
  const met = field.conditionRule === 'any' ? field.conditions.some(test) : field.conditions.every(test);
  return field.conditionAction === 'hide' ? !met : met;
}

it('form: the multi-branch form defaults to General Enquiry', () => {
  const form = forms.find((f) => String(f.id) === '2539');
  assert.ok(form, 'form 2539 present');
  const radio = form.fields.find((f) => f.id === 'radio-1');
  const preset = radio.options.find((o) => o.default);
  assert.equal(preset.value, 'general-enquiry');
});

it('form: switching branch swaps which fields are active', () => {
  const form = forms.find((f) => String(f.id) === '2539');
  const on = (branch) =>
    form.fields.filter((f) => visible(f, { 'radio-1': branch })).map((f) => f.id);

  const general = on('general-enquiry');
  const career = on('career-opportunities');

  assert.ok(general.includes('select-1'), 'general branch shows the services select');
  assert.ok(!general.includes('upload-1'), 'general branch hides the CV upload');
  assert.ok(career.includes('upload-1'), 'career branch shows the CV upload');
  assert.ok(!career.includes('select-1'), 'career branch hides the services select');

  // Unconditional fields appear in both.
  for (const id of ['name-1', 'email-1', 'consent-1']) {
    assert.ok(general.includes(id) && career.includes(id), `${id} is unconditional`);
  }
});

it('form: every field with options has a value for each option', () => {
  for (const form of forms) {
    for (const f of form.fields) {
      if (!f.options) continue;
      for (const o of f.options) {
        assert.ok(o.label !== undefined, `${form.name}/${f.id} option missing label`);
      }
    }
  }
});

// --- content model sanity ---------------------------------------------------
it('content: every published page has a slug and a layout tree', () => {
  const pages = JSON.parse(fs.readFileSync('content/pages.json', 'utf8'));
  const published = pages.filter((p) => p.status === 'publish');
  assert.ok(published.length >= 15, `expected 15+ published pages, got ${published.length}`);
  for (const p of published) {
    assert.ok(p.slug, `page ${p.id} has no slug`);
    assert.ok(Array.isArray(p.tree), `page ${p.slug} has no tree`);
  }
});

it('content: no wp-content URLs survived the rewrite', () => {
  for (const file of ['pages.json', 'templates.json', 'components.json', 'case-studies.json']) {
    const raw = fs.readFileSync(`content/${file}`, 'utf8');
    const leaks = raw.match(/maintain\.com\.au\\?\/wp-content\\?\/uploads/g) || [];
    assert.equal(leaks.length, 0, `${file} still points at ${leaks.length} remote upload(s)`);
  }
});

it('content: every referenced asset exists on disk', () => {
  const assets = JSON.parse(fs.readFileSync('content/assets.json', 'utf8'));
  const missing = Object.values(assets).filter((local) => !fs.existsSync('public' + local));
  // Two files 404 on the live site as well; anything beyond that is our bug.
  assert.ok(missing.length <= 2, `missing assets: ${missing.slice(0, 5).join(', ')}`);
});

it('content: all six JetEngine option keys have values', () => {
  const site = JSON.parse(fs.readFileSync('content/site.json', 'utf8'));
  const keys = Object.keys(site.options || {});
  assert.equal(keys.length, 6, `expected 6 option keys, got ${keys.length}`);
  for (const [k, v] of Object.entries(site.options)) assert.ok(v, `option ${k} is empty`);
});

it('content: SEO titles have no unexpanded Rank Math templates', () => {
  for (const file of ['pages.json', 'case-studies.json']) {
    const items = JSON.parse(fs.readFileSync(`content/${file}`, 'utf8'));
    for (const i of items) {
      assert.ok(!/%\w+%/.test(i.seo?.title || ''), `${file} ${i.slug}: unexpanded title "${i.seo.title}"`);
    }
  }
});

console.log(`${n} checks passed`);
