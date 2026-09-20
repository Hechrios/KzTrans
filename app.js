(function () {
  'use strict';

  const converter = window.QazaqConverter;
  const root = document.documentElement;
  const sourceScript = document.getElementById('sourceScript');
  const targetScript = document.getElementById('targetScript');
  const inputText = document.getElementById('inputText');
  const outputText = document.getElementById('outputText');
  const convertButton = document.getElementById('convertButton');
  const copyButton = document.getElementById('copyButton');
  const copyLabel = document.getElementById('copyLabel');
  const fontToggle = document.getElementById('fontToggle');
  const fontModeLabel = document.getElementById('fontModeLabel');
  const themeToggle = document.getElementById('themeToggle');
  const themeModeLabel = document.getElementById('themeModeLabel');
  const liveStatus = document.getElementById('liveStatus');
  const routeReadout = document.getElementById('routeReadout');
  const scriptTrack = document.getElementById('scriptTrack');
  const titleSubtitle = document.getElementById('titleSubtitle');
  const defaultText = 'قازاق ٴالىپبيى';
  const canonicalScript = 'Cn-Ar';
  const SCRIPT_SUBTITLES = {
    'Cn-Ar': '\u049A\u0430\u0437\u0430\u049B \u0416\u0430\u0437\u0443 \u0422\u0440\u0430\u043D\u0441\u043A\u0440\u0438\u043F\u0446\u0438\u044F\u0441\u044B',
    'Cn-La': 'Qazaq Zhazy Trxnskrjptsjxsi',
    'Cn-Nw': '\u2C69aza\u2C6A Jazw Tr\u0259nskryptsy\u0259si',
    'Cn-Py': 'K\u0302azak\u0302 Jazw Tr\u00E4nskryptsy\u00E4si',
    'Kz-Cy': '\u049A\u0430\u0437\u0430\u049B \u0416\u0430\u0437\u0443 \u0422\u0440\u0430\u043D\u0441\u043A\u0440\u0438\u043F\u0446\u0438\u044F\u0441\u044B',
    'Kz-17.0': 'Qazaq Zhazw Transkripcijasy',
    'Kz-17': 'Qazaq Z\u2019azy\u2019 Transkri\u2019ptsi\u2019i\u2019asy',
    'Kz-18': 'Qazaq Jaz\u00FD Transkr\u0131pts\u0131\u0131asy',
    'Kz-21': 'Qazaq Jazu Transkriptsiiasy'
  };
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  const state = {
    fontMode: 'classic',
    theme: 'day',
    subtitleSequence: 0
  };

  function readPreference(key, fallback) {
    try {
      return window.localStorage.getItem(key) || fallback;
    } catch {
      return fallback;
    }
  }

  function writePreference(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      return;
    }
  }

  function announce(message) {
    liveStatus.textContent = '';
    window.requestAnimationFrame(function () {
      liveStatus.textContent = message;
    });
  }

  function setFontMode(mode, persist) {
    state.fontMode = mode === 'noto' ? 'noto' : 'classic';
    root.classList.toggle('fonts-noto', state.fontMode === 'noto');
    root.classList.toggle('fonts-classic', state.fontMode === 'classic');
    fontModeLabel.textContent = state.fontMode === 'noto' ? 'Noto Sans' : 'UKIJ + Times';
    if (persist) writePreference('qazaq-font-mode-times', state.fontMode);
  }

  function setTheme(theme, persist) {
    state.theme = theme === 'night' ? 'night' : 'day';
    root.dataset.theme = state.theme;
    themeModeLabel.textContent = state.theme === 'night' ? 'Night' : 'Day';
    document.querySelector('meta[name="theme-color"]').setAttribute(
      'content',
      state.theme === 'night' ? '#172123' : '#B0E0E6'
    );
    if (persist) writePreference('qazaq-theme', state.theme);
  }

  function updateTextDirection() {
    inputText.dir = sourceScript.value === canonicalScript ? 'rtl' : 'ltr';
    outputText.dir = targetScript.value === canonicalScript ? 'rtl' : 'ltr';
    routeReadout.textContent = sourceScript.value + ' → ' + targetScript.value;

    scriptTrack.querySelectorAll('[data-script]').forEach(function (chip) {
      const script = chip.dataset.script;
      chip.classList.toggle('is-source', script === sourceScript.value);
      chip.classList.toggle('is-target', script === targetScript.value);
      chip.classList.toggle('is-active', script === sourceScript.value || script === targetScript.value);
    });
  }

  function subtitleTextFor(script) {
    return SCRIPT_SUBTITLES[script] || SCRIPT_SUBTITLES['Cn-Ar'];
  }

  function graphemes(value) {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      return Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(value), function (item) {
        return item.segment;
      });
    }
    return Array.from(value);
  }

  function typeSubtitle(script) {
    state.subtitleSequence += 1;
    const sequence = state.subtitleSequence;
    const value = subtitleTextFor(script);
    titleSubtitle.classList.toggle('is-strong', script === 'Cn-Ar' || script === 'Kz-Cy');
    const units = graphemes(value);

    titleSubtitle.classList.add('is-typing');
    titleSubtitle.textContent = '';
    titleSubtitle.setAttribute('aria-label', value);

    if (reduceMotion.matches) {
      titleSubtitle.textContent = value;
      titleSubtitle.classList.remove('is-typing');
      return;
    }

    let index = 0;
    function typeNext() {
      if (sequence !== state.subtitleSequence) return;
      titleSubtitle.textContent += units[index] || '';
      index += 1;
      if (index < units.length) {
        window.setTimeout(typeNext, 32);
      } else {
        titleSubtitle.classList.remove('is-typing');
      }
    }

    typeNext();
  }

  function convertNow() {
    try {
      outputText.value = converter.convert(inputText.value, sourceScript.value, targetScript.value);
      outputText.scrollTop = 0;
      announce('Conversion completed.');
    } catch {
      outputText.value = '';
      announce('Conversion failed.');
    }
  }

  function resetCopiedState() {
    copyButton.classList.remove('is-copied');
    copyLabel.textContent = 'كوشىرۋ';
  }

  async function copyOutput() {
    const text = outputText.value;
    if (!text) {
      announce('There is no output to copy.');
      return;
    }

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        outputText.focus();
        outputText.select();
        document.execCommand('copy');
        outputText.setSelectionRange(0, 0);
        outputText.blur();
      }
      copyButton.classList.add('is-copied');
      copyLabel.textContent = 'كوشىرىلدى';
      announce('Output copied.');
      window.setTimeout(resetCopiedState, 1500);
    } catch {
      announce('Copy failed.');
    }
  }

  function handleTargetChange() {
    updateTextDirection();
    typeSubtitle(targetScript.value);
    convertNow();
  }

  function handleSourceChange() {
    updateTextDirection();
    convertNow();
  }

  fontToggle.addEventListener('click', function () {
    setFontMode(state.fontMode === 'classic' ? 'noto' : 'classic', true);
  });

  themeToggle.addEventListener('click', function () {
    setTheme(state.theme === 'day' ? 'night' : 'day', true);
  });

  convertButton.addEventListener('click', convertNow);
  copyButton.addEventListener('click', copyOutput);
  sourceScript.addEventListener('change', handleSourceChange);
  targetScript.addEventListener('change', handleTargetChange);

  inputText.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      convertNow();
    }
  });

  inputText.value = defaultText;
  setFontMode(readPreference('qazaq-font-mode-times', 'classic'), false);
  setTheme(readPreference('qazaq-theme', 'day'), false);
  updateTextDirection();
  convertNow();
  typeSubtitle(targetScript.value);
}());
