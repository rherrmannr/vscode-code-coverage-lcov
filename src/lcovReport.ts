import * as vscode from "vscode";
import * as chokidar from "chokidar";
import { disableDecorations, applyCoverage } from "./decorations";
import path from "path";
import { custom } from "./log";
import { LcovFile } from "lcov-parse";
import { readLcovFile } from "./lcov";
import { config } from "process";

let lcovFiles: LcovFile[] = [];
let lcovFilesCache: LcovFile[] = [];

let loaded: boolean = false;
export let filePath: string = "";

export async function resolveLCOVFile() {
  if (filePath === "") {
    return;
  }
  lcovFilesCache = lcovFiles;
  loaded = false;
  console.error("loaded:", loaded);
  lcovFiles = await readLcovFile(filePath);
  loaded = true;
  console.error("loaded:", loaded);
}

export function getLcovFiles(): LcovFile[] {
  if (loaded) {
    return lcovFiles;
  }
  return lcovFilesCache;
}

export async function loadFilePath() {
  let configPath = getFilePath();
  if (!configPath) {
    vscode.window.showErrorMessage("Unable read Search Path.");
    return false;
  }

  if (!path.isAbsolute(configPath)) {
    await vscode.workspace.findFiles(configPath).then((files) => {
      if (files.length > 0) {
        filePath = files[0].fsPath;
      } else {
        vscode.window.showErrorMessage(
          "Unable to load lcov report: " + configPath
        );
        filePath = "";
      }
    });

    return;
  }
  filePath = configPath;
}

let watcher: chokidar.FSWatcher | null = null;

export function disableWatchReport() {
  watcher?.removeAllListeners();
  disableDecorations();
}
let stop = false;

export async function activateWatchReport(): Promise<void> {
  await resolveLCOVFile();
  watcher = chokidar.watch(filePath);
  watcher.on("change", async (path) => {
    stop = false;
    while (!stop) {
      stop = true;
      await resolveLCOVFile().then(undefined, (err) => {
        console.error("Unable to resolve lcov file");
        stop = false;
      });
    }
    await applyCoverage();
  });
  watcher.on("error", (error) => {
    vscode.window.showErrorMessage(`Error watching file: ${error}`);
  });
}

function getFilePath(): string {
  const config = vscode.workspace.getConfiguration("code-coverage-lcov.path");
  const searchPath: string | undefined = config.get("searchPath");
  if (!searchPath) {
    return "";
  }
  return searchPath;
}

export function disableReportWatcher() {
  watcher?.close();
}
