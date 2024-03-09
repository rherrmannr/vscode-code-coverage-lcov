import { spawnSync } from "child_process";
import * as path from "path";

import { runTests } from "@vscode/test-electron";

async function main() {
  try {
    // The folder containing the Extension Manifest package.json
    // Passed to `--extensionDevelopmentPath`
    const extensionDevelopmentPath = path.resolve(__dirname, "../../../");
    const workspacePath = path.resolve(__dirname, "../../../test/configs/");

    // The path to the extension test runner script
    // Passed to --extensionTestsPath
    const extensionTestsPath = path.resolve(__dirname, "./index");

    const launchArgs = [workspacePath, "--disable-extensions"];
    // Download VS Code, unzip it and run the integration test
    await runTests({
      launchArgs,
      extensionDevelopmentPath,
      extensionTestsPath,
    });
  } catch (err) {
    console.error(err);
    console.error("Failed to run tests");
    process.exit(1);
  }
}

main();
