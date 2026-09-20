const test = require('node:test');
const assert = require('node:assert/strict');
const converter = require('../converter.js');

test('converts Qazaq between the reference scripts', () => {
  const source = 'قازاق';
  assert.equal(converter.convert(source, 'Cn-Ar', 'Cn-La'), 'Qazaq');
  assert.equal(converter.convert(source, 'Cn-Ar', 'Cn-Nw'), 'Ⱪazaⱪ');
  assert.equal(converter.convert(source, 'Cn-Ar', 'Cn-Py'), 'K̂azak̂');
  assert.equal(converter.convert(source, 'Cn-Ar', 'Kz-Cy'), 'Қазақ');
  assert.equal(converter.convert(source, 'Cn-Ar', 'Kz-17.0'), 'Qazaq');
  assert.equal(converter.convert(source, 'Cn-Ar', 'Kz-17'), 'Qazaq');
  assert.equal(converter.convert(source, 'Cn-Ar', 'Kz-18'), 'Qazaq');
  assert.equal(converter.convert(source, 'Cn-Ar', 'Kz-21'), 'Qazaq');
});

test('decodes reference scripts back to Cn-Ar', () => {
  const expected = 'قازاق';
  for (const [source, script] of [
    ['Qazaq', 'Cn-La'],
    ['Ⱪazaⱪ', 'Cn-Nw'],
    ['K̂azak̂', 'Cn-Py'],
    ['Қазақ', 'Kz-Cy'],
    ['Qazaq', 'Kz-17.0'],
    ['Qazaq', 'Kz-17'],
    ['Qazaq', 'Kz-18'],
    ['Qazaq', 'Kz-21']
  ]) {
    assert.equal(converter.convert(source, script, 'Cn-Ar'), expected);
  }
});

test('keeps the front-vowel marker distinct', () => {
  assert.equal(converter.convert('ٴا', 'Cn-Ar', 'Cn-La'), 'X');
  assert.equal(converter.convert('X', 'Cn-La', 'Cn-Ar'), 'ٴا');
});

test('keeps one front marker and removes it after front-vowel signals', () => {
  assert.equal(converter.convert('تٴىلٴى', 'Cn-Ar', 'Cn-Ar'), 'ٴتىلى');
  assert.equal(converter.convert('كىتاپ', 'Cn-Ar', 'Cn-Ar'), 'كىتاپ');
  assert.equal(converter.convert('tili', 'Cn-La', 'Cn-Ar'), 'ٴتىلى');
});

test('handles Cyrillic-only reverse forms', () => {
  assert.equal(converter.convert('Я', 'Kz-Cy', 'Cn-Ar'), 'يا');
  assert.equal(converter.convert('Ю', 'Kz-Cy', 'Cn-Ar'), 'يۋ');
  assert.equal(converter.convert('Щ', 'Kz-Cy', 'Cn-Ar'), 'شش');
  assert.equal(converter.convert('ь', 'Kz-Cy', 'Cn-Ar'), '');
  assert.equal(converter.convert('цар', 'Kz-Cy', 'Cn-Ar'), 'سار');
});

test('uses corrected Chinese Latin defaults and H-g disambiguation', () => {
  assert.equal(converter.convert('\u0686', 'Cn-Ar', 'Cn-Nw'), 'Ch');
  assert.equal(converter.convert('ch', 'Cn-Nw', 'Cn-Ar'), '\u0686');
  assert.equal(converter.convert('q', 'Cn-Nw', 'Cn-Ar'), '\u0686');

  assert.equal(converter.convert('\u06AD', 'Cn-Ar', 'Cn-La'), 'Hg');
  assert.equal(converter.convert('Hg', 'Cn-La', 'Cn-Ar'), '\u06AD');
  assert.equal(converter.convert('Ng', 'Cn-La', 'Cn-Ar'), '\u06AD');
  assert.equal(converter.convert("H'g", 'Cn-La', 'Cn-Ar'), '\u06BE\u06AF');
  assert.equal(converter.convert('\u06BE\u06AF', 'Cn-Ar', 'Cn-La'), "H'g");
});

test('applies official 2018 and 2021 Latin corrections', () => {
  assert.equal(converter.convert('\u0674\u0648', 'Cn-Ar', 'Kz-21'), '\u00D6');

  assert.equal(converter.convert('\u064A', 'Cn-Ar', 'Kz-18'), 'I');
  assert.equal(converter.convert('\u064A', 'Cn-Ar', 'Kz-21'), '\u0130');
  assert.equal(converter.convert('\u064A\u0627', 'Cn-Ar', 'Kz-18'), 'Ia');
  assert.equal(converter.convert('\u064A\u0627', 'Cn-Ar', 'Kz-21'), '\u0130a');
  assert.equal(converter.convert('\u064A\u06CB', 'Cn-Ar', 'Kz-18'), 'I\u00FD');
  assert.equal(converter.convert('\u064A\u06CB', 'Cn-Ar', 'Kz-21'), '\u0130u');
  assert.equal(converter.convert('\u064A\u0648', 'Cn-Ar', 'Kz-18'), 'Io');
  assert.equal(converter.convert('\u064A\u0648', 'Cn-Ar', 'Kz-21'), '\u0130o');

  assert.equal(converter.convert('shsh', 'Kz-18', 'Cn-Ar'), '\u0634\u0634');
  assert.equal(converter.convert('Ia', 'Kz-18', 'Cn-Ar'), '\u064A\u0627');
  assert.equal(converter.convert('\u0130a', 'Kz-21', 'Cn-Ar'), '\u064A\u0627');
  assert.equal(converter.convert('I\u00FD', 'Kz-18', 'Cn-Ar'), '\u064A\u06CB');
  assert.equal(converter.convert('\u0130u', 'Kz-21', 'Cn-Ar'), '\u064A\u06CB');
  assert.equal(converter.convert('\u015F\u015F', 'Kz-21', 'Cn-Ar'), '\u0634\u0634');
  assert.equal(converter.convert('\u044D', 'Kz-Cy', 'Cn-Ar'), '\u06D5');
});

test('collapses Cyrillic ??, ?? and ?? before Arabic output', () => {
  assert.equal(converter.convert('\u0438\u044F', 'Kz-Cy', 'Cn-Ar'), '\u064A\u0627');
  assert.equal(converter.convert('\u0438\u044E', 'Kz-Cy', 'Cn-Ar'), '\u064A\u06CB');
  assert.equal(converter.convert('\u0438\u0451', 'Kz-Cy', 'Cn-Ar'), '\u064A\u0648');
});

test('transliterates Cyrillic directly to standard Kazakh Latin scripts', () => {
  assert.equal(converter.convert('\u0429', 'Kz-Cy', 'Kz-18'), 'Shsh');
  assert.equal(converter.convert('\u0429', 'Kz-Cy', 'Kz-17.0'), 'Shsh');
  assert.equal(converter.convert('\u042F', 'Kz-Cy', 'Kz-17.0'), 'Ja');
  assert.equal(converter.convert('\u042E', 'Kz-Cy', 'Kz-17.0'), 'Ju');
  assert.equal(converter.convert('\u0401', 'Kz-Cy', 'Kz-17.0'), 'Jo');
  assert.equal(converter.convert('\u0426', 'Kz-Cy', 'Kz-17.0'), 'C');
  assert.equal(converter.convert('\u042F', 'Kz-Cy', 'Kz-18'), 'Ia');
  assert.equal(converter.convert('\u042E', 'Kz-Cy', 'Kz-21'), '\u0130u');
  assert.equal(converter.convert('\u0401', 'Kz-Cy', 'Kz-21'), '\u0130o');
  assert.equal(converter.convert('\u0426', 'Kz-Cy', 'Kz-18'), 'Ts');
  assert.equal(converter.convert('\u0427', 'Kz-Cy', 'Kz-17'), 'C\u2019');
  assert.equal(converter.convert('\u042F', 'Kz-Cy', 'Kz-17'), 'I\u2019a');
  assert.equal(converter.convert('\u042E', 'Kz-Cy', 'Kz-17'), 'I\u2019u');
  assert.equal(converter.convert('\u0401', 'Kz-Cy', 'Kz-17'), 'I\u2019o');
  assert.equal(converter.convert('\u0429', 'Kz-Cy', 'Kz-17'), 'S\u2019s\u2019');
  assert.equal(converter.convert('\u0426', 'Kz-Cy', 'Kz-17'), 'Ts');
  assert.equal(converter.convert('\u0449', 'Kz-Cy', 'Kz-21'), '\u015F\u015F');
  assert.equal(converter.convert('\u0426\u0430\u0440', 'Kz-Cy', 'Kz-18'), 'Tsar');
  assert.equal(converter.convert('\u0446\u0430\u0440', 'Kz-Cy', 'Kz-21'), 'tsar');
  assert.equal(converter.convert('\u0401', 'Kz-Cy', 'Kz-18'), 'Io');
  assert.equal(converter.convert('\u0451', 'Kz-Cy', 'Kz-21'), 'io');
  assert.equal(converter.convert('\u042F', 'Kz-Cy', 'Kz-21'), '\u0130a');
  assert.equal(converter.convert('\u044E', 'Kz-Cy', 'Kz-18'), '\u0131\u00FD');
  assert.equal(converter.convert('\u049A\u0430\u0437\u0430\u049B', 'Kz-Cy', 'Kz-21'), 'Qazaq');
  assert.equal(converter.convert('\u042A\u044C', 'Kz-Cy', 'Kz-18'), '');
});

test('handles Kazakh punctuation and capitalization', () => {
  assert.equal(converter.convert('قازاق، تٴىلٴى؟', 'Cn-Ar', 'Cn-La'), 'Qazaq, tili?');
  assert.equal(converter.convert('Qazaq, tili?', 'Cn-La', 'Cn-Ar'), 'قازاق، ٴتىلى؟');
});
