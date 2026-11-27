import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isLang, isRtl, type Lang, type MessageKey, t as translate, translateStatus as translateStatusName } from '../../i18n/index.ts';

const STORAGE_KEY = 'backlog-lang';

interface LanguageContextType {
	lang: Lang;
	setLang: (lang: Lang) => void;
	t: (key: MessageKey, params?: Record<string, string>) => string;
	translateStatus: (status: string) => string;
}

/** Without a provider (for example a component rendered on its own) the UI stays in English. */
const DEFAULT_CONTEXT: LanguageContextType = {
	lang: 'en',
	setLang: () => {},
	t: (key, params = {}) => translate(key, params, 'en'),
	translateStatus: (status) => translateStatusName(status, 'en'),
};

const LanguageContext = createContext<LanguageContextType>(DEFAULT_CONTEXT);

export const useLanguage = () => useContext(LanguageContext);

function readStoredLang(): Lang | null {
	try {
		const value = localStorage.getItem(STORAGE_KEY);
		return isLang(value) ? value : null;
	} catch {
		return null;
	}
}

/**
 * Provides the UI language. A choice saved in the browser wins; until then the server's
 * BACKLOG_LANG (from /api/status) is the initial value. The language is always passed explicitly,
 * because the shared i18n helpers read `process.env` only when no language is given.
 */
export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [lang, setLangState] = useState<Lang>(() => readStoredLang() ?? 'en');

	useEffect(() => {
		if (readStoredLang()) return;
		let cancelled = false;
		fetch('/api/status')
			.then((res) => (res.ok ? res.json() : null))
			.then((data) => {
				if (!cancelled && !readStoredLang() && isLang(data?.lang)) setLangState(data.lang);
			})
			.catch(() => {});
		return () => {
			cancelled = true;
		};
	}, []);

	useEffect(() => {
		document.documentElement.lang = lang;
		document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr';
	}, [lang]);

	const setLang = useCallback((next: Lang) => {
		setLangState(next);
		try {
			localStorage.setItem(STORAGE_KEY, next);
		} catch {
			// Storage can be unavailable; the choice then lasts for this page load only.
		}
	}, []);

	const value = useMemo<LanguageContextType>(
		() => ({
			lang,
			setLang,
			t: (key, params = {}) => translate(key, params, lang),
			translateStatus: (status) => translateStatusName(status, lang),
		}),
		[lang, setLang],
	);

	return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
