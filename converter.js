(function (root) {
  'use strict';

  const RULES = root.QAZAQ_RULES || (typeof require === 'function' ? require('./rules.js') : []);
  const CYRILLIC_RULES = root.QAZAQ_CYRILLIC_RULES || RULES.CYRILLIC_RULES || [];
  const SCRIPTS = ['Cn-Ar', 'Cn-La', 'Cn-Nw', 'Cn-Py', 'Kz-Cy', 'Kz-17.0', 'Kz-17', 'Kz-18', 'Kz-21'];
  const KZ_LATIN_SCRIPTS = new Set(['Kz-17.0', 'Kz-17', 'Kz-18', 'Kz-21']);
  const CANONICAL = 'Cn-Ar';
  const WORD_BOUNDARIES = new Set([' ', '\t', '\r', '\n', '.', ',', ':', ';', '!', '?', '،', '؛', '؟', '«', '»', '"', '“', '”', '(', ')', '[', ']', '{', '}', '-', '—']);
  const SENTENCE_END = new Set(['.', '!', '?', '؟', '\n']);
  const VOWELS = new Set(['ا', 'و', 'ۇ', 'ۆ', 'ە', 'ى']);
  const FRONT_MARKER = '\u0674';
  const FRONT_SIGNAL_LETTERS = new Set(['گ', 'ك', 'ە']);
  const FRONT_VOWEL_MAP = { 'ا': 'ٴا', 'و': 'ٴو', 'ۇ': 'ٴۇ', 'ى': 'ٴى' };

  const PUNCT_TO_CANONICAL = new Map([
    ['.', '.'], [',', '،'], [':', ':'], [';', '؛'], ['?', '؟'], ['!', '!'],
    ['-', '-'], ['"', '«'], ['“', '«'], ['”', '»']
  ]);
  const PUNCT_FROM_CANONICAL = new Map([
    ['،', ','], ['؛', ';'], ['؟', '?']
  ]);

  const MANUAL_DECODE = {
    'Kz-Cy': [
      ['\u0438\u044F', '\u064A\u0627'], ['\u0438\u044E', '\u064A\u06CB'], ['\u0438\u0451', '\u064A\u0648'],
      ['\u044F', '\u064A\u0627'], ['\u044E', '\u064A\u06CB'], ['\u0451', '\u064A\u0648'], ['\u0449', '\u0634\u0634'], ['\u0439', '\u064A'],
      ['\u044C', ''], ['\u044A', ''], ['\u0446', '\u062A\u0633'], ['\u044D', '\u06D5']
    ],
    'Kz-17.0': [
      ['ya', '\u064A\u0627'], ['yu', '\u064A\u06CB'], ['yo', '\u064A\u0648'], ['shsh', '\u0634\u0634'], ['ts', '\u062A\u0633'],
      ['\u2019', ''], ["'", ''], ["''", '']
    ],
    'Kz-18': [
      ['io', '\u064A\u0648'], ['shsh', '\u0634\u0634'], ['ts', '\u062A\u0633']
    ],
    'Kz-21': [
      ['io', '\u064A\u0648'], ['\u015F\u015F', '\u0634\u0634'], ['ts', '\u062A\u0633']
    ]
  };

  function normalize(value) {
    return String(value || '')
      .normalize('NFC')
      .replace(/\u00a0/g, ' ')
      .replace(/İ/g, 'I')
      .replace(/ı/g, 'i')
      .toLowerCase();
  }

  function parseCell(value) {
    return String(value || '')
      .split('/')
      .map(function (part) { return part.trim(); })
      .filter(Boolean)
      .map(function (part) {
        const pieces = part.split(/\s+/).filter(Boolean);
        const upper = pieces[0] || '';
        const lower = pieces[1] || upper.toLocaleLowerCase('en-US');
        return { upper: upper, lower: lower };
      });
  }

  const directCyrillicLatin = {};
  KZ_LATIN_SCRIPTS.forEach(function (script) {
    directCyrillicLatin[script] = new Map();
  });

  CYRILLIC_RULES.forEach(function (rule) {
    const source = parseCell(rule['Kz-Cy'])[0];
    if (!source) return;

    KZ_LATIN_SCRIPTS.forEach(function (script) {
      const target = parseCell(rule[script])[0];
      if (!target) return;
      const mapping = directCyrillicLatin[script];
      if (source.upper && target.upper) mapping.set(source.upper, target.upper);
      if (source.lower && target.lower) mapping.set(source.lower, target.lower);
    });
  });

  ['\u042A', '\u044A', '\u042C', '\u044C'].forEach(function (sign) {
    KZ_LATIN_SCRIPTS.forEach(function (script) {
      directCyrillicLatin[script].set(sign, '');
    });
  });

  const rulesByCanonical = new Map();
  const sourceTokens = {};
  const targetEntries = {};
  SCRIPTS.forEach(function (script) {
    sourceTokens[script] = [];
    targetEntries[script] = [];
  });

  RULES.forEach(function (rule) {
    const canonical = String(rule.canonical || '').normalize('NFC');
    if (!canonical) return;
    rulesByCanonical.set(canonical, rule);

    SCRIPTS.slice(1).forEach(function (script) {
      const mapping = rule[script];
      if (!mapping) return;

      const skipReverseCyrillicSequence = script === 'Kz-Cy' && (canonical === 'يا' || canonical === 'يۋ');
      if (!skipReverseCyrillicSequence) {
        targetEntries[script].push({ canonical: canonical, mapping: mapping });
      }

      parseCell(mapping).forEach(function (pair) {
        [pair.upper, pair.lower].forEach(function (raw) {
          if (!raw) return;
          sourceTokens[script].push({ raw: raw, norm: normalize(raw), canonical: canonical, priority: 0 });
        });
      });
    });
  });

  Object.keys(MANUAL_DECODE).forEach(function (script) {
    MANUAL_DECODE[script].forEach(function (item) {
      sourceTokens[script].push({ raw: item[0], norm: normalize(item[0]), canonical: item[1], priority: 1 });
    });
  });

  Object.keys(sourceTokens).forEach(function (script) {
    const byKey = new Map();
    sourceTokens[script].forEach(function (token) {
      const key = token.norm + '\u0000' + token.canonical;
      const current = byKey.get(key);
      if (!current || token.priority > current.priority ||
          (token.priority === current.priority && token.raw.length > current.raw.length)) {
        byKey.set(key, token);
      }
    });
    sourceTokens[script] = Array.from(byKey.values())
      .sort(function (a, b) { return (b.priority - a.priority) || (b.norm.length - a.norm.length); });
    targetEntries[script].sort(function (a, b) { return b.canonical.length - a.canonical.length; });
  });

  function isWordBoundary(char) {
    return !char || WORD_BOUNDARIES.has(char) || /\s/.test(char);
  }

  function isVowel(char) {
    return VOWELS.has(char);
  }

  function normalizeArabicWord(word) {
    const chars = Array.from(word).filter(function (char) { return char !== FRONT_MARKER; });
    const hasFrontSignal = word.includes(FRONT_MARKER) || chars.some(function (char) {
      return FRONT_SIGNAL_LETTERS.has(char);
    });
    if (!hasFrontSignal) return word;
    if (chars.some(function (char) { return FRONT_SIGNAL_LETTERS.has(char); })) return chars.join('');

    return word.includes(FRONT_MARKER) ? FRONT_MARKER + chars.join('') : word;
  }

  function normalizeArabicFrontVowels(value) {
    return String(value || '').normalize('NFC').replace(/[\p{L}\p{M}\u0674]+/gu, normalizeArabicWord);
  }

  function expandArabicWord(word) {
    const chars = Array.from(word).filter(function (char) { return char !== FRONT_MARKER; });
    const hasFrontSignal = word.includes(FRONT_MARKER) || chars.some(function (char) {
      return FRONT_SIGNAL_LETTERS.has(char);
    });
    if (!hasFrontSignal) return word;
    return chars.map(function (char) { return FRONT_VOWEL_MAP[char] || char; }).join('');
  }

  function expandFrontVowels(value) {
    return String(value || '').normalize('NFC').replace(/[\p{L}\p{M}\u0674]+/gu, expandArabicWord);
  }

  function findSourceToken(text, index, script) {
    const tokens = sourceTokens[script] || [];
    const remaining = text.slice(index);
    const normalizedRemaining = normalize(remaining);
    for (let indexToken = 0; indexToken < tokens.length; indexToken += 1) {
      const token = tokens[indexToken];
      if (token.norm.length > remaining.length) continue;
      if (normalizedRemaining.slice(0, token.norm.length) === token.norm) return token;
    }
    return null;
  }

  function convertCyrillicToKzLatin(value, target) {
    const mapping = directCyrillicLatin[target] || new Map();
    let output = '';
    for (const char of String(value == null ? '' : value)) {
      output += mapping.has(char) ? mapping.get(char) : char;
    }
    return output;
  }

  function decodeToCanonical(text, script) {
    if (script === CANONICAL) return normalizeArabicFrontVowels(text);
    let output = '';
    let index = 0;
    let wordStart = true;

    while (index < text.length) {
      const char = text[index];
      if (/\s/.test(char)) {
        output += char;
        wordStart = true;
        index += 1;
        continue;
      }
      if (WORD_BOUNDARIES.has(char) && char !== "'" && char !== '’') {
        output += PUNCT_TO_CANONICAL.get(char) || char;
        wordStart = true;
        index += 1;
        continue;
      }

      if (script === 'Kz-Cy' && wordStart && normalize(char) === 'ц') {
        output += 'س';
        wordStart = false;
        index += 1;
        continue;
      }

      const token = findSourceToken(text, index, script);
      if (token) {
        output += token.canonical;
        if (token.canonical) wordStart = false;
        index += token.raw.length;
        continue;
      }

      output += char;
      if (!isWordBoundary(char)) wordStart = false;
      index += 1;
    }

    return normalizeArabicFrontVowels(output);
  }

  function applyLetterCase(value, uppercase) {
    if (!value) return value;
    return uppercase ? value.charAt(0).toLocaleUpperCase('en-US') + value.slice(1) : value;
  }

  function selectVariant(rule, target, uppercase, context) {
    const variants = parseCell(rule[target]);
    if (!variants.length) return '';

    if (target === 'Kz-Cy' && rule.canonical === 'ي') {
      const previous = context.index > 0 ? context.text[context.index - 1] : '';
      const next = context.text[context.index + 1] || '';
      const startsWord = isWordBoundary(previous);
      const followsVowel = isVowel(previous);
      const followedByVowel = ['ا', 'ۋ', 'و'].includes(next);
      const useShortI = startsWord && !followedByVowel;
      const useY = (!startsWord && followsVowel) || (startsWord && followedByVowel);
      if (useY) return uppercase ? 'Й' : 'й';
      if (useShortI) return uppercase ? 'И' : 'и';
    }

    const variant = variants[0];
    return uppercase ? variant.upper : variant.lower;
  }

  function fromCanonical(input, target, options) {
    const text = expandFrontVowels(input);
    if (target === CANONICAL) return normalizeArabicFrontVowels(text);
    const settings = options || {};
    const shouldCapitalize = Boolean(settings.capitalize);
    const entries = targetEntries[target] || [];
    let output = '';
    let index = 0;
    let sentenceStart = shouldCapitalize;
    let wordStart = true;

    while (index < text.length) {
      const char = text[index];

      if (char === '«' && text[index + 1] === '»') {
        output += target === 'Kz-Cy' ? '«»' : '""';
        index += 2;
        wordStart = true;
        continue;
      }
      if (/\s/.test(char)) {
        output += char;
        if (char === '\n') sentenceStart = shouldCapitalize;
        wordStart = true;
        index += 1;
        continue;
      }
      if (PUNCT_FROM_CANONICAL.has(char) || WORD_BOUNDARIES.has(char)) {
        output += PUNCT_FROM_CANONICAL.get(char) || char;
        if (SENTENCE_END.has(char)) sentenceStart = shouldCapitalize;
        wordStart = true;
        index += 1;
        continue;
      }

      let entry = null;
      for (let entryIndex = 0; entryIndex < entries.length; entryIndex += 1) {
        const candidate = entries[entryIndex];
        if (candidate.canonical && text.slice(index, index + candidate.canonical.length) === candidate.canonical) {
          entry = candidate;
          break;
        }
      }

      const uppercase = shouldCapitalize && sentenceStart;
      if (entry) {
        const rule = rulesByCanonical.get(entry.canonical);
        const value = selectVariant(rule, target, uppercase, { text: text, index: index });
        output += value || entry.canonical;
        sentenceStart = false;
        wordStart = false;
        index += entry.canonical.length;
        continue;
      }

      output += char;
      sentenceStart = false;
      wordStart = false;
      index += 1;
    }

    return output;
  }

  function convert(text, from, to, options) {
    const source = String(text == null ? '' : text);
    if (!SCRIPTS.includes(from) || !SCRIPTS.includes(to)) throw new Error('Unsupported script.');
    if (from === 'Kz-Cy' && KZ_LATIN_SCRIPTS.has(to)) return convertCyrillicToKzLatin(source, to);
    if (from === to) return from === CANONICAL ? normalizeArabicFrontVowels(source) : source;
    const canonical = decodeToCanonical(source, from);
    if (to === CANONICAL) return canonical;
    return fromCanonical(canonical, to, Object.assign({}, options, { capitalize: from === CANONICAL }));
  }

  const api = {
    convert: convert,
    decodeToCanonical: decodeToCanonical,
    fromCanonical: fromCanonical,
    scripts: SCRIPTS.slice(),
    normalize: normalize
  };

  root.QazaqConverter = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
