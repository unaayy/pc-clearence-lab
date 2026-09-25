import es from './es.json';
import en from './en.json';

const translations = { es, en };

export function getLangFromUrl(url: URL) {
  const [, lang] = url.pathname.split('/');
  if (lang in translations) return lang as keyof typeof translations;
  return 'es';
}

export function useTranslations(lang: keyof typeof translations) {
  return function t(key: keyof typeof es) {
    return translations[lang][key] || translations['es'][key];
  };
}