import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import JSON files
import en from '../locales/en/translation.json';
import es from '../locales/es/translation.json';
import de from '../locales/de/translation.json';
import it from '../locales/it/translation.json';
import ru from '../locales/ru/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      de: { translation: de },
      it: { translation: it },
      ru: { translation: ru },
    },
    fallbackLng: 'en',
    lng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
