import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';
import yaml from 'js-yaml';

// Import language files
import zhCN from './locales/zh-CN.yml';

// Initialize i18next
i18n
  // Use Backend plugin to load translations from files
  .use(Backend)
  // Use LanguageDetector plugin to detect user language
  .use(LanguageDetector)
  // Use initReactI18next plugin to integrate with React
  .use(initReactI18next)
  // Initialize i18next with configuration
  .init({
    // Default language
    lng: 'zh-CN',
    // Fallback language if translation is not available in current language
    fallbackLng: 'zh-CN',
    // Debug mode for development
    debug: process.env.NODE_ENV === 'development',
    // Interpolation configuration
    interpolation: {
      // Escape values to prevent XSS attacks
      escapeValue: false,
    },
    // Supported languages
    supportedLngs: ['zh-CN'],
    // Backend configuration
    backend: {
      // Load translations from local files
      loadPath: '/locales/{{lng}}.yml',
      // Parse YAML files
      parse: (data) => yaml.load(data),
    },
    // Resources for each language
    resources: {
      'zh-CN': {
        translation: zhCN,
      },
    },
    // React integration options
    react: {
      // Use Suspense for loading translations
      useSuspense: true,
    },
  });

export default i18n;
