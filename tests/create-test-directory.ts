import { join } from "node:path";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { type ExecSyncOptionsWithBufferEncoding, execSync } from "node:child_process";

import { getUserConfig } from "../src";
import { Logger } from "../src/utils/logger";

export function createTestDir(testName: string) {
	const testLocation = join(process.cwd(), "..", "fork-version.tests"); // Need to step up outside of the fork-version repo to avoid git conflicts.
	const testDirName = `${Date.now()}-${testName}`;
	const testDir = join(testLocation, testDirName);

	const execSyncOptions: ExecSyncOptionsWithBufferEncoding = {
		cwd: testDir,
		stdio: "ignore",
	};

	if (!existsSync(testDir)) {
		mkdirSync(testDir, { recursive: true });

		if (!existsSync(testDir)) {
			throw new Error("Unable to create test folder.");
		}
	} else {
		throw new Error(`Test folder already exists: ${testDir}`);
	}

	execSync("git init", execSyncOptions);
	execSync("git config commit.gpgSign false", execSyncOptions);
	execSync("git config core.autocrlf false", execSyncOptions);

	return {
		testDirName,
		testDir,

		deleteTestDir: function _deleteTestDir() {
			rmSync(testDir, { recursive: true, force: true });
		},

		createJSONFile: function _createJSONFile(jsObject?: object, file = "package.json") {
			const stringifiedPackage = JSON.stringify(jsObject ?? { version: "1.0.0" }, null, 2);

			writeFileSync(join(testDir, file), stringifiedPackage, "utf-8");
			execSync(`git add ${file}`, execSyncOptions);
		},

		createCommits: function _createCommits(commits?: string[]) {
			const testCommits = Array.isArray(commits)
				? commits
				: ["initial commit", "feat: A feature commit", "test: A test commit", "fix: A fix commit"];

			for (const commitMessage of testCommits) {
				execSync(`git commit --allow-empty -m "${commitMessage}"`, execSyncOptions);
			}
		},

		createTestConfig: async function _createTestConfig() {
			const config = await getUserConfig();
			config.workingDirectory = testDir;

			const logger = new Logger({ silent: true, debug: false });
			logger.log = vi.fn();
			logger.warn = vi.fn();
			logger.error = vi.fn();
			logger.debug = vi.fn();

			return {
				config,
				logger,
			};
		},
	};
}