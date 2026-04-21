const I18N_STORAGE_KEY = "site-locale";
const I18N_DEFAULT_LOCALE = "en";
const I18N_SUPPORTED_LOCALES = new Set(["zh", "en", "ja"]);
let i18nMessages = {};
let currentLocale = I18N_DEFAULT_LOCALE;

const getTranslationValue = (object, key) => {
  return key.split(".").reduce((current, part) => {
    if (current && typeof current === "object" && part in current) {
      return current[part];
    }

    return undefined;
  }, object);
};

const interpolateTranslation = (template, params = {}) => {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    return key in params ? String(params[key]) : `{${key}}`;
  });
};

window.t = (key, params = {}) => {
  const template = getTranslationValue(i18nMessages, key);

  if (typeof template !== "string") {
    return key;
  }

  return interpolateTranslation(template, params);
};

window.getLocale = () => currentLocale;

window.applyTranslations = (root = document) => {
  root.querySelectorAll("[data-i18n]").forEach((element) => {
    const translated = window.t(element.dataset.i18n);

    if (translated !== element.dataset.i18n) {
      element.textContent = translated;
    }
  });

  root.querySelectorAll("[data-i18n-aria-label]").forEach((element) => {
    const translated = window.t(element.dataset.i18nAriaLabel);

    if (translated !== element.dataset.i18nAriaLabel) {
      element.setAttribute("aria-label", translated);
    }
  });

  root.querySelectorAll("[data-i18n-title]").forEach((element) => {
    const translated = window.t(element.dataset.i18nTitle);

    if (translated !== element.dataset.i18nTitle) {
      element.setAttribute("title", translated);
    }
  });

  root.querySelectorAll(".language-option[data-lang]").forEach((element) => {
    element.setAttribute("aria-pressed", String(element.dataset.lang === currentLocale));
  });
};

const loadLocaleMessages = async (locale) => {
  const response = await fetch(`./locales/${locale}.json?v=20260419`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to load locale file.");
  }

  return response.json();
};

window.setLocale = async (locale) => {
  const nextLocale = I18N_SUPPORTED_LOCALES.has(locale) ? locale : I18N_DEFAULT_LOCALE;
  const messages = await loadLocaleMessages(nextLocale);

  i18nMessages = messages;
  currentLocale = nextLocale;
  localStorage.setItem(I18N_STORAGE_KEY, nextLocale);
  document.documentElement.lang = nextLocale === "zh" ? "zh-Hant" : nextLocale;
  window.applyTranslations();
  window.dispatchEvent(new CustomEvent("i18n:change", {
    detail: { locale: nextLocale },
  }));
};

const initialLocale = (() => {
  const savedLocale = localStorage.getItem(I18N_STORAGE_KEY);

  if (savedLocale && I18N_SUPPORTED_LOCALES.has(savedLocale)) {
    return savedLocale;
  }

  return I18N_DEFAULT_LOCALE;
})();

window.i18nReady = window.setLocale(initialLocale)
  .catch(() => {
    currentLocale = I18N_DEFAULT_LOCALE;
    document.documentElement.lang = "zh-Hant";
  });
