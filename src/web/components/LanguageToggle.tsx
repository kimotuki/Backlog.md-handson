import React from 'react';
import type { Lang } from '../../i18n/index.ts';
import { useLanguage } from '../contexts/LanguageContext';

const OPTIONS: { value: Lang; label: string }[] = [
	{ value: 'en', label: 'English' },
	{ value: 'ja', label: '日本語' },
	{ value: 'ar', label: 'العربية' },
];

const LanguageToggle: React.FC = () => {
	const { lang, setLang, t } = useLanguage();
	const label = t('web.langToggle');
	return (
		<select
			value={lang}
			onChange={(event) => setLang(event.target.value as Lang)}
			className="px-2 py-1 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-stone-500"
			aria-label={label}
			title={label}
		>
			{OPTIONS.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	);
};

export default LanguageToggle;
