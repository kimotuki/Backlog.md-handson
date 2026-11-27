import type { Command } from "commander";
import { DEFAULT_STATUSES } from "../constants/index.ts";
import { ar } from "./ar.ts";
import { en, type MessageKey } from "./en.ts";
import { ja } from "./ja.ts";

export const LANGS = ["en", "ja", "ar"] as const;
export type Lang = (typeof LANGS)[number];

export function isLang(value: unknown): value is Lang {
	return typeof value === "string" && (LANGS as readonly string[]).includes(value);
}

/** Languages written right to left. */
export const RTL_LANGS: readonly Lang[] = ["ar"];

export function isRtl(lang: Lang): boolean {
	return RTL_LANGS.includes(lang);
}
export type { MessageKey };

const CATALOGS: Record<Lang, Record<MessageKey, string>> = { en, ja, ar };

/** Resolves the display language from BACKLOG_LANG. Unset or unsupported values fall back to English. */
export function resolveLang(env: Record<string, string | undefined> = process.env): Lang {
	const value = env.BACKLOG_LANG?.trim().toLowerCase();
	return value === "ja" || value === "ar" ? value : "en";
}

/** Looks up a message, replacing `{name}` placeholders with the given params. */
export function t(key: MessageKey, params: Record<string, string> = {}, lang: Lang = resolveLang()): string {
	const template = CATALOGS[lang][key] ?? en[key];
	return template.replace(/\{(\w+)\}/g, (match, name: string) => params[name] ?? match);
}

/**
 * Display name of a status. Only the default statuses are translated; custom statuses from the
 * user's config are shown as written. Stored values and filters always stay in their original form.
 */
export function translateStatus(status: string, lang: Lang = resolveLang()): string {
	if ((DEFAULT_STATUSES as readonly string[]).includes(status)) {
		return t(`status.${status}` as MessageKey, {}, lang);
	}
	return status;
}

/**
 * Replaces command descriptions with the active language's text. English keeps the descriptions
 * the commands were registered with, so only other languages rewrite them.
 */
export function applyHelpTranslations(program: Command, lang: Lang = resolveLang()): void {
	if (lang === "en") return;
	const apply = (command: Command, path: string) => {
		const key = `help.${path}` as MessageKey;
		if (key in CATALOGS[lang]) command.description(CATALOGS[lang][key]);
	};
	program.description(t("help.root", {}, lang));
	for (const command of program.commands) {
		apply(command, command.name());
		// Only the subcommands of `task` are covered for now.
		if (command.name() === "task") {
			for (const sub of command.commands) apply(sub, `task.${sub.name()}`);
		}
	}
}
