import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export type Locale = string;

export interface TranslationRecord {
  [key: string]: string | TranslationRecord;
}

export interface I18nConfig {
  defaultLocale: Locale;
  locales: Locale[];
  messages: Record<Locale, TranslationRecord>;
  /** Fallback locale when translation is missing (default: defaultLocale) */
  fallbackLocale?: Locale;
  /** Date formatting options */
  dateFormat?: Intl.DateTimeFormatOptions;
  /** Number formatting options */
  numberFormat?: Intl.NumberFormatOptions;
}

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date | string, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (value: number, currency: string) => string;
  availableLocales: Locale[];
  isRTL: boolean;
}

const RTL_LOCALES = ['ar', 'he', 'fa', 'ur', 'yi', 'dv', 'ha', 'khw', 'ks', 'ku', 'ps', 'sd', 'ug'];

const I18nContext = createContext<I18nContextValue | null>(null);

function getNestedValue(obj: TranslationRecord, key: string): string | undefined {
  const parts = key.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === 'string' ? current : undefined;
}

function interpolate(template: string, params: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{{${key}}}`
  );
}

export interface I18nProviderProps {
  config: I18nConfig;
  children: ReactNode;
  /** Override initial locale */
  initialLocale?: Locale;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ config, children, initialLocale }) => {
  const [locale, setLocaleState] = useState<Locale>(
    initialLocale ||
      (typeof navigator !== 'undefined'
        ? config.locales.find((l) => navigator.language.startsWith(l)) || config.defaultLocale
        : config.defaultLocale)
  );

  const setLocale = useCallback(
    (newLocale: Locale) => {
      if (!config.locales.includes(newLocale)) {
        console.warn(`[i18n] Locale '${newLocale}' is not in configured locales`);
        return;
      }
      setLocaleState(newLocale);

      if (typeof document !== 'undefined') {
        document.documentElement.lang = newLocale;
        document.documentElement.dir = RTL_LOCALES.includes(newLocale.split('-')[0])
          ? 'rtl'
          : 'ltr';
      }
    },
    [config.locales]
  );

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const messages = config.messages[locale] || {};
      const fallbackMessages = config.messages[config.fallbackLocale || config.defaultLocale] || {};

      const value = getNestedValue(messages, key) || getNestedValue(fallbackMessages, key);

      if (!value) {
        console.warn(`[i18n] Missing translation for key: '${key}' in locale '${locale}'`);
        return key;
      }

      return params ? interpolate(value, params) : value;
    },
    [locale, config.messages, config.defaultLocale, config.fallbackLocale]
  );

  const formatDate = useCallback(
    (date: Date | string, options?: Intl.DateTimeFormatOptions): string => {
      const d = typeof date === 'string' ? new Date(date) : date;
      return new Intl.DateTimeFormat(locale, options || config.dateFormat).format(d);
    },
    [locale, config.dateFormat]
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions): string => {
      return new Intl.NumberFormat(locale, options || config.numberFormat).format(value);
    },
    [locale, config.numberFormat]
  );

  const formatCurrency = useCallback(
    (value: number, currency: string): string => {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
    },
    [locale]
  );

  const isRTL = RTL_LOCALES.includes(locale.split('-')[0]);

  return (
    <I18nContext.Provider
      value={{
        locale,
        setLocale,
        t,
        formatDate,
        formatNumber,
        formatCurrency,
        availableLocales: config.locales,
        isRTL,
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = (): I18nContextValue => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used inside <I18nProvider>');
  return ctx;
};

// Convenience alias
export const useI18n = useTranslation;
