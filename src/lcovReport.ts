import * as vscode from "vscode";
import * as chokidar from "chokidar";
import { applyCoverage } from "./decorations";
import path from "path";

let watcher: chokidar.FSWatcher | null = null;

export function watchReport() {
  let filePath = getFilePath();
  if (!filePath) {
    vscode.window.showErrorMessage("Unable read Search Path.");
    return;
  }

  if (path.isAbsolute(filePath)) {
    applyCoverage(filePath);
    watchReportChange(filePath);
  } else {
    vscode.workspace.findFiles(filePath).then((files) => {
      if (files.length > 0) {
        const filePath = files[0].fsPath;
        applyCoverage(filePath);
        watchReportChange(filePath);
      } else {
        vscode.window.showErrorMessage(
          "Unable to load lcov report: " + filePath
        );
      }
    });
  }
}

function watchReportChange(filePath: string): void {
  watcher = chokidar.watch(filePath);
  watcher.on("change", async (path) => {
    await applyCoverage(path);
  });
  watcher.on("error", (error) => {
    vscode.window.showErrorMessage(`Error watching file: ${error}`);
  });
}

function getFilePath(): string | undefined {
  const config = vscode.workspace.getConfiguration("code-coverage-lcov.path");
  return config.get("searchPath");
}

export function disableReportWatcher() {
  watcher?.close();
}
