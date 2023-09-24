#!/usr/bin/env node

import { getForkConfig } from "./configuration.js";
import { bumpVersion } from "./version.js";
import { updateChangelog } from "./changelog.js";

async function runFork() {
	const options = await getForkConfig();

	const bumpResult = await bumpVersion(options);
	const changelogResult = await updateChangelog(options, bumpResult);

	console.log({
		options,
		bumpResult,
		changelogResult,
	});
}

runFork();
