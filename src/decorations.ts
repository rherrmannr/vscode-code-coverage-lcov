import * as vscode from "vscode";
import { LcovBranch, LcovFile, LcovLine } from "lcov-parse";
import { makePathsAbsolute, readLcovFile } from "./lcov";
import { custom } from "./log";
import { getLcovFiles } from "./lcovReport";
import { Config, getConfig } from "./config";

const decorationTypes = new Map<
  string,
  Map<LcovLine, vscode.TextEditorDecorationType>
>();

let isApplyingCoverage = false;

export async function disableDecorations() {
  removeDecorationTypes();
  isApplyingCoverage = false;
}

export async function applyDecorationTypes(editor: vscode.TextEditor) {
  let traceDecorationTypeMap = decorationTypes.get(editor.document.fileName);
  if (!traceDecorationTypeMap) {
    return;
  }

  traceDecorationTypeMap.forEach((decorationType, trace) => {
    editor.setDecorations(decorationType, [
      new vscode.Range(
        trace.line - 1,
        0,
        trace.line - 1,
        editor.document.lineAt(trace.line - 1).range.end.character
      ),
    ]);
  });
}

export async function applyCoverage() {
  if (isApplyingCoverage) {
    return;
  }
  isApplyingCoverage = true;

  removeDecorationTypes();
  decorationTypes.clear();
  let config = getConfig();
  if (!config) {
    isApplyingCoverage = false;
    return;
  }
  let editors = vscode.window.visibleTextEditors;

  for (const editor of editors) {
    let lcovFile = getLcovFileForEditor(editor);
    if (!lcovFile) {
      continue;
    }
    custom.log("Apply coverage for:", editor.document.uri.fsPath);

    setDecorationTypes(lcovFile, config);
    applyDecorationTypes(editor);
  }
  isApplyingCoverage = false;
}

function removeDecorationTypes() {
  let editors = vscode.window.visibleTextEditors;
  for (const editor of editors) {
    custom.log("Reset coverage for:", editor.document.uri.fsPath);
    let traceDecorationTypeMap = decorationTypes.get(
      editor.document.uri.fsPath
    );
    if (!traceDecorationTypeMap) {
      continue;
    }

    traceDecorationTypeMap.forEach((decorationType) => {
      editor.setDecorations(decorationType, []);
    });
  }
}

function createDecorationType(
  line: LcovLine,
  branches: LcovBranch[],
  config: Config
) {
  // return uncovored
  if (line.hit === 0) {
    return vscode.window.createTextEditorDecorationType({
      backgroundColor: config.uncoveredColor,
    });
  }
  // return all covored
  if (
    branches.every((branch) => {
      return branch.taken > 0;
    }) ||
    !config.branchCoverageEnabled
  ) {
    return vscode.window.createTextEditorDecorationType({
      backgroundColor: config.coveredColor,
    });
  }
  // return branch covored
  return vscode.window.createTextEditorDecorationType({
    backgroundColor: config.branchColor,
  });
}

function getLcovFileForEditor(editor: vscode.TextEditor) {
  let lcovFiles = getLcovFiles();
  let fileNames = lcovFiles.map((lcovFile) => {
    return lcovFile.file;
  });

  let editorPath = editor.document.uri.fsPath;
  if (!fileNames.includes(editor.document.uri.fsPath)) {
    return undefined;
  }
  let lcovFile = lcovFiles.find((lcovFile) => {
    return lcovFile.file === editorPath;
  });
  return lcovFile;
}

async function setDecorationTypes(lcovFile: LcovFile, config: Config) {
  lcovFile.lines.details.forEach((lcovLine) => {
    let branches = lcovFile.branches.details.filter((branch) => {
      return lcovLine.line === branch.line;
    });
    if (config === undefined) {
      return;
    }
    let decorationType = createDecorationType(lcovLine, branches, config);
    let v = decorationTypes.get(lcovFile.file);
    if (v) {
      v.set(lcovLine, decorationType);
    } else {
      let map: Map<LcovLine, vscode.TextEditorDecorationType> = new Map<
        LcovLine,
        vscode.TextEditorDecorationType
      >();
      map.set(lcovLine, decorationType);
      decorationTypes.set(lcovFile.file, map);
    }
  });
}
