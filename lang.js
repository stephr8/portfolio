// lang.js
(function () {
  var KEY = 'lang';

  function initialLang() {
    try {
      var saved = localStorage.getItem(KEY);
      if (saved === 'de' || saved === 'en') return saved;   // manual choice wins
    } catch (e) {}
    var pref = (navigator.languages && navigator.languages[0]) || navigator.language || '';
    return /^de/i.test(pref) ? 'de' : 'en';
  }

  function apply(lang) {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-de][data-en]').forEach(function (el) {
      el.textContent = el.dataset[lang];
    });
    var btn = document.getElementById('lang-toggle');
    if (btn) btn.textContent = lang === 'de' ? 'EN' : 'DE';   // shows the language you can switch to
  }

  var current = initialLang();
  apply(current);

  var btn = document.getElementById('lang-toggle');
  if (btn) {
    btn.addEventListener('click', function () {
      current = current === 'de' ? 'en' : 'de';
      try { localStorage.setItem(KEY, current); } catch (e) {}
      apply(current);
    });
  }
})();