import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

const LanguageToggle: React.FC = () => {
	const { lang, setLang, t } = useLanguage();
	const next = lang === 'ja' ? 'en' : 'ja';
	const label = t('web.langToggle', { lang: next === 'ja' ? '日本語' : 'English' });
	return (
		<button
			type="button"
			onClick={() => setLang(next)}
			className="px-2 py-1 text-sm font-medium rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-stone-500"
			aria-label={label}
			title={label}
		>
			{next === 'ja' ? '日本語' : 'EN'}
		</button>
	);
};

export default LanguageToggle;
