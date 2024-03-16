import * as vscode from "vscode";
import {
  disableDecorations,
  applyCoverage,
  removeDecorationTypes,
} from "./decorations";
import path from "path";
import fs from "fs";
import { custom } from "./log";
import { LcovFile } from "lcov-parse";
import { loadLcovFiles } from "./lcov";
import { updateStatusBar } from "./statusBar";

let watcher: fs.FSWatcher | null = null;
let lcovFilesCache: LcovFile[] = [];
let activeLcovFile: string = "";
let display: boolean = false;

export function getLcovFiles(): LcovFile[] {
  return lcovFilesCache;
}

export function disableWatchReport() {
  if (watcher) {
    watcher.removeAllListeners();
  }
  disableDecorations();
}

export function executeDisplay() {
  return new Promise<void>((resolve, reject) => {
    runCoverage().then(
      () => {
        display = true;
        updateStatusBar(display);
        activateWatchReport();
        return resolve();
      },
      (reason: string) => {
        vscode.window.showErrorMessage(reason);
        return reject();
      }
    );
  });
}

export function onDidChangeVisibleTextEditors(
  editors: readonly vscode.TextEditor[]
) {
  if (display) {
    applyCoverage();
  }
}

export function executeHide() {
  disableWatchReport();
  removeDecorationTypes();
  display = false;
  updateStatusBar(display);
}

export function disableReportWatcher() {
  if (watcher) {
    watcher.close();
  }
}

function loadLcovFromFileAndApplyCoverage(
  resolve: (value: void | PromiseLike<void>) => void,
  reject: (reason?: any) => void
) {
  if (!fs.existsSync(activeLcovFile)) {
    return reject("Unable to open file: " + activeLcovFile);
  }
  loadLcovFiles(activeLcovFile).then(
    (lcovFiles) => {
      lcovFilesCache = lcovFiles;
      applyCoverage();
    },
    (reason) => {
      return reject(reason);
    }
  );
  return resolve();
}

function runCoverage() {
  return new Promise<void>((resolve, reject) => {
    let searchPath = getSearchPath();
    if (!searchPath) {
      return reject("Unable read searchPath from config.");
    }

    // check if file path must be changed to absolute
    if (!path.isAbsolute(searchPath)) {
      vscode.workspace.findFiles(searchPath).then((files) => {
        if (files.length > 0) {
          activeLcovFile = files[0].fsPath;
          return loadLcovFromFileAndApplyCoverage(resolve, reject);
        } else {
          return reject("Unable to find file in workspace: " + searchPath);
        }
      });
    } else {
      activeLcovFile = searchPath;
      return loadLcovFromFileAndApplyCoverage(resolve, reject);
    }
  });
}

function getSearchPath(): string | undefined {
  const config = vscode.workspace.getConfiguration("code-coverage-lcov.path");
  return config.get("searchPath");
}

function activateWatchReport() {
  watcher = fs.watch(activeLcovFile, async (event, filename) => {
    custom.log("Event: ", event, " on: ", filename);
    let promise = new Promise((reject, resolve) => {
      loadLcovFromFileAndApplyCoverage(reject, resolve);
    });
    promise.catch((reason) => {
      vscode.window.showErrorMessage(reason);
      executeHide();
    });
  });
}
