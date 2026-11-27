import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { FileSystem } from "../file-system/operations.ts";
import { BacklogServer } from "../server/index.ts";
import { createUniqueTestDir, safeCleanup } from "./test-utils.ts";

let testDir: string;
let server: BacklogServer | null = null;
let originalLang: string | undefined;

async function startServer(): Promise<number> {
	const filesystem = new FileSystem(testDir);
	await filesystem.ensureBacklogStructure();
	await filesystem.saveConfig({
		projectName: "Status Lang",
		statuses: ["To Do", "In Progress", "Done"],
		labels: [],
		milestones: [],
		dateFormat: "YYYY-MM-DD",
		remoteOperations: false,
	});
	server = new BacklogServer(testDir);
	await server.start(0, false);
	return server.getPort() ?? 0;
}

describe("/api/status language", () => {
	beforeEach(() => {
		testDir = createUniqueTestDir("server-status-lang");
		originalLang = process.env.BACKLOG_LANG;
	});

	afterEach(async () => {
		if (server) {
			await server.stop();
			server = null;
		}
		if (originalLang === undefined) delete process.env.BACKLOG_LANG;
		else process.env.BACKLOG_LANG = originalLang;
		await safeCleanup(testDir);
	});

	it("reports en by default", async () => {
		delete process.env.BACKLOG_LANG;
		const port = await startServer();
		const body = await (await fetch(`http://127.0.0.1:${port}/api/status`)).json();
		expect(body.lang).toBe("en");
	});

	it("reports ar when BACKLOG_LANG=ar", async () => {
		process.env.BACKLOG_LANG = "ar";
		const port = await startServer();
		const body = await (await fetch(`http://127.0.0.1:${port}/api/status`)).json();
		expect(body.lang).toBe("ar");
	});

	it("reports ja when BACKLOG_LANG=ja", async () => {
		process.env.BACKLOG_LANG = "ja";
		const port = await startServer();
		const body = await (await fetch(`http://127.0.0.1:${port}/api/status`)).json();
		expect(body.lang).toBe("ja");
	});
});
