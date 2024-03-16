import parse, { LcovFile } from "lcov-parse";
import * as vscode from "vscode";
import { custom } from "./log";

export async function loadLcovFiles(filePath: string): Promise<LcovFile[]> {
  return new Promise((resolve, reject) => {
    parse(filePath, (error, data) => {
      if (error) {
        custom.error("Failed to resolve '" + filePath + "', received: ", error);
        return reject(error);
      }
      if (data === undefined) {
        custom.error("Failed to resolve '" + filePath + "', data: ", data);
        return reject();
      }
      makePathsAbsolute(data);
      return resolve(data);
    });
  });
}

function makePathsAbsolute(files: LcovFile[]) {
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
  } else {
    return filePath;
  }
}
