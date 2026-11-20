const test = require('node:test');
const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');
const rules = require('../rules.js');

const SCRIPTS = ['Cn-Ar', 'Cn-La', 'Cn-Nw', 'Cn-Py', 'Kz-Cy', 'Kz-17.0', 'Kz-17', 'Kz-18', 'Kz-21'];

function boardValues() {
  const chips = html.match(/data-script="[^"]+"/g) || [];
  return chips.map((chip) => chip.slice('data-script="'.length, -1));
}

function selectOptions(id) {
  const open = html.indexOf('<select id="' + id + '"');
  assert.notEqual(open, -1, 'index.html 里找不到 #' + id);
  const close = html.indexOf('</select>', open);
  const block = html.slice(open, close);
  const options = [];
  const re = /<option value="([^"]+)"([^>]*)>/g;
  let match;
  while ((match = re.exec(block)) !== null) {
    options.push({ value: match[1], selected: /\bselected\b/.test(match[2]) });
  }
  return options;
}

/* 回归：output 下拉曾把 Kz-18 写成 Kz-Cy，导致 Kz-18 永远选不中 */
test('both script selects list every supported script exactly once', () => {
  for (const id of ['sourceScript', 'targetScript']) {
    const values = selectOptions(id).map((option) => option.value);
    assert.deepEqual(values, SCRIPTS, id + ' 的选项与脚本清单不一致');
  }
});

test('script selects expose no duplicate values', () => {
  for (const id of ['sourceScript', 'targetScript']) {
    const values = selectOptions(id).map((option) => option.value);
    assert.equal(new Set(values).size, values.length, id + ' 存在重复选项');
  }
});

test('a script is selected exactly once per select', () => {
  for (const id of ['sourceScript', 'targetScript']) {
    const selected = selectOptions(id).filter((option) => option.selected);
    assert.equal(selected.length, 1, id + ' 应恰好有一个 selected 选项');
  }
});

test('default target stays Kz-Cy and source stays Cn-Ar', () => {
  const source = selectOptions('sourceScript').find((option) => option.selected);
  const target = selectOptions('targetScript').find((option) => option.selected);
  assert.equal(source.value, 'Cn-Ar');
  assert.equal(target.value, 'Kz-Cy');
});

test('every selectable script is convertible by the rules engine', () => {
  const registered = new Set();
  for (const rule of rules) {
    for (const key of Object.keys(rule)) {
      if (key !== 'pattern' && key !== 'flags') registered.add(key);
    }
  }
  for (const script of SCRIPTS) {
    const key = script === 'Cn-Ar' ? 'canonical' : script;
    assert.ok(registered.has(key), '规则里缺少脚本 ' + script);
  }
});

test('footer route chips match the script list', () => {
  assert.deepEqual(boardValues(), SCRIPTS);
});
