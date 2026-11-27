import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdir } from "node:fs/promises";
import { $ } from "bun";
import { Core } from "../core/backlog.ts";
import { en } from "../i18n/en.ts";
import { resolveLang, t, translateStatus } from "../i18n/index.ts";
import { ja } from "../i18n/ja.ts";
import type { Task } from "../types";
import { getTestCliPath } from "./test-cli.ts";
import { createUniqueTestDir, initializeFilesystemTestProject, safeCleanup } from "./test-utils.ts";

const CLI_PATH = getTestCliPath();

describe("i18n catalogs", () => {
	test("ja defines exactly the keys of en", () => {
		expect(Object.keys(ja).sort()).toEqual(Object.keys(en).sort());
	});

	test("ja keeps the same placeholders as en", () => {
		for (const key of Object.keys(en) as (keyof typeof en)[]) {
			const placeholders = (text: string) => (text.match(/\{\w+\}/g) ?? []).sort();
			expect(placeholders(ja[key])).toEqual(placeholders(en[key]));
		}
	});
});

describe("resolveLang", () => {
	test("defaults to en", () => {
		expect(resolveLang({})).toBe("en");
	});
	test("selects ja from BACKLOG_LANG", () => {
		expect(resolveLang({ BACKLOG_LANG: "ja" })).toBe("ja");
		expect(resolveLang({ BACKLOG_LANG: " JA " })).toBe("ja");
	});
	test("falls back to en for unsupported values", () => {
		expect(resolveLang({ BACKLOG_LANG: "fr" })).toBe("en");
		expect(resolveLang({ BACKLOG_LANG: "" })).toBe("en");
	});
});

describe("t and translateStatus", () => {
	test("substitutes placeholders", () => {
		expect(t("list.noChildTasks", { parent: "task-1" }, "en")).toBe("No child tasks found for parent task task-1.");
		expect(t("list.noChildTasks", { parent: "task-1" }, "ja")).toContain("task-1");
	});
	test("translates default statuses only", () => {
		expect(translateStatus("In Progress", "ja")).toBe("進行中");
		expect(translateStatus("In Progress", "en")).toBe("In Progress");
		expect(translateStatus("Blocked", "ja")).toBe("Blocked");
	});
});

describe("CLI language switching", () => {
	let testDir: string;

	beforeEach(async () => {
		testDir = createUniqueTestDir("test-i18n");
		await mkdir(testDir, { recursive: true });
		const core = new Core(testDir);
		await initializeFilesystemTestProject(core, "I18n Test");
		const task: Task = {
			id: "task-1",
			title: "First Task",
			status: "To Do",
			assignee: [],
			createdDate: "2026-01-01 00:00",
			labels: [],
			dependencies: [],
			description: "Seed",
		};
		await core.createTask(task, false);
	});

	afterEach(async () => {
		await safeCleanup(testDir);
	});

	test("--help is English by default", async () => {
		const result = await $`bun ${CLI_PATH} --help`
			.cwd(testDir)
			.env({ ...process.env, BACKLOG_LANG: "" })
			.quiet();
		expect(result.stdout.toString()).toContain("Backlog.md - Project management CLI");
	});

	test("--help is Japanese with BACKLOG_LANG=ja", async () => {
		const result = await $`bun ${CLI_PATH} --help`
			.cwd(testDir)
			.env({ ...process.env, BACKLOG_LANG: "ja" })
			.quiet();
		const out = result.stdout.toString();
		expect(out).toContain(ja["help.root"]);
		expect(out).toContain(ja["help.overview"]);
	});

	test("task --help lists Japanese subcommand descriptions", async () => {
		const result = await $`bun ${CLI_PATH} task --help`
			.cwd(testDir)
			.env({ ...process.env, BACKLOG_LANG: "ja" })
			.quiet();
		expect(result.stdout.toString()).toContain(ja["help.task.list"]);
	});

	test("task list --plain shows English headings by default", async () => {
		const result = await $`bun ${CLI_PATH} task list --plain`
			.cwd(testDir)
			.env({ ...process.env, BACKLOG_LANG: "" })
			.quiet();
		expect(result.stdout.toString()).toContain("To Do:");
	});

	test("task list --plain translates the status heading with BACKLOG_LANG=ja", async () => {
		const result = await $`bun ${CLI_PATH} task list --plain`
			.cwd(testDir)
			.env({ ...process.env, BACKLOG_LANG: "ja" })
			.quiet();
		const out = result.stdout.toString();
		expect(out).toContain("未着手:");
		expect(out).toContain("First Task");
	});

	test("empty list message is translated and filters keep the stored status value", async () => {
		const result = await $`bun ${CLI_PATH} task list --plain --status Done`
			.cwd(testDir)
			.env({ ...process.env, BACKLOG_LANG: "ja" })
			.quiet();
		expect(result.stdout.toString()).toContain(ja["list.noTasks"]);
	});
});
