import parse, { LcovFile } from "lcov-parse";
import * as fs from "fs";
import * as vscode from "vscode";

export function readLcovFile(filePath: string): Promise<LcovFile[]> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      tryParse(filePath, resolve, reject);
    });
  });
}

function tryParse(
  filePath: string,
  resolve: (value: parse.LcovFile[] | PromiseLike<parse.LcovFile[]>) => void,
  reject: (reason?: any) => void
) {
  parse(filePath, (error, data) => {
    if (error) {
      reject(error);
      return;
    }
    if (data === undefined) {
      reject();
      return;
    }
    resolve(data);
    return;
  });
}

export function makePathsAbsolute(files: LcovFile[]) {
  files.forEach((file) => {
    let absolutePath = getAbsolutePath(file.file);
    if (absolutePath) {
      file.file = absolutePath;
    }
  });
}

function getAbsolutePath(filePath: string): string | undefined {
  const path = require("path");
  if (!path.isAbsolute(filePath)) {
    let workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
      vscode.window.showErrorMessage(
        "Unable to create absolute path for lcov files."
      );
      return undefined;
    }
    return path.join(workspaceFolders[0].uri.fsPath, filePath);
  }
}
