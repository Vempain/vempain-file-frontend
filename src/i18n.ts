import i18n from 'i18next';
import {initReactI18next} from 'react-i18next';
import Backend from 'i18next-http-backend';
import {i18nextPlugin} from 'translation-check'
import {viteEnv} from './viteEnv';

const env = viteEnv();

// false means "no language restriction" per i18next convention
const supportedLngs = env.VITE_I18N_SUPPORTED_LANGS
    ? env.VITE_I18N_SUPPORTED_LANGS.split(',').map((l: string) => l.trim())
    : false;

i18n
    .use(Backend)
    .use(initReactI18next)
    .use(i18nextPlugin)
    .init({
        fallbackLng: env.VITE_I18N_DEFAULT_LANG || 'en',
        debug: false,
        supportedLngs,
        backend: {
            loadPath: '/locales/{{lng}}.json'
        }
    });

export default i18n;
