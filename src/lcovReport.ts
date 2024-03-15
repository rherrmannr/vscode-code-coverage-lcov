import * as vscode from "vscode";
import * as chokidar from "chokidar";
import { disableDecorations, applyCoverage } from "./decorations";
import path from "path";
import fs from "fs";
import { custom } from "./log";
import { LcovFile } from "lcov-parse";
import { makePathsAbsolute, readLcovFile } from "./lcov";
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
  lcovFiles = await readLcovFile(filePath);
  makePathsAbsolute(lcovFiles);
  loaded = true;
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

export async function activateWatchReport(): Promise<void> {
  await resolveLCOVFile();
  fs.watch(filePath, async (event, filename) => {
    let stop = false;
    while (!stop) {
      stop = true;
      await resolveLCOVFile().then(undefined, (err) => {
        custom.error("Unable to resolve lcov file");
        stop = false;
      });
    }
    await applyCoverage();
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
