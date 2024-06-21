import * as vscode from "vscode";
import { LcovBranch, LcovFile, LcovLine } from "lcov-parse";
import { custom } from "./log";
import { getLcovFiles } from "./lcovReport";
import { ColorConfig, Config, getConfig } from "./config";

let appliedDecorationTypes: vscode.TextEditorDecorationType[] = [];

let isApplyingCoverage = false;

export async function disableDecorations() {
  removeDecorationTypes();
  isApplyingCoverage = false;
}

export async function applyDecorationTypes(
  editor: vscode.TextEditor,
  config: Config,
  lcovFile: LcovFile
) {
  createDecorationTypes(config, lcovFile).forEach((decorationType, trace) => {
    appliedDecorationTypes.push(decorationType);
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

export function applyCoverage() {
  if (isApplyingCoverage) {
    return;
  }
  isApplyingCoverage = true;

  removeDecorationTypes();
  let config = getConfig();
  let editors = vscode.window.visibleTextEditors;

  for (const editor of editors) {
    let lcovFile = getLcovFileForEditor(editor);
    if (!lcovFile) {
      continue;
    }
    custom.log("Apply coverage for:", editor.document.uri.fsPath);

    applyDecorationTypes(editor, config, lcovFile);
  }
  isApplyingCoverage = false;
}

export function removeDecorationTypes() {
  custom.log("remove all decoration types");
  appliedDecorationTypes.forEach((it) => {
    it.dispose();
  });
  appliedDecorationTypes = [];
}

function createDecorationType(
  line: LcovLine,
  branches: LcovBranch[],
  config: Config
) {
  // return uncovored
  if (line.hit === 0) {
    return getDecorationType(config, config.uncoveredColor);
  }

  // return all covored
  if (
    branches.every((branch) => {
      return branch.taken > 0;
    }) ||
    !config.coverageConfig.branchCoverage
  ) {
    return getDecorationType(config, config.coveredColor);
  }

  // return covored
  return getDecorationType(config, config.branchColor);
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

function createDecorationTypes(
  config: Config,
  lcovFile: LcovFile
): Map<LcovLine, vscode.TextEditorDecorationType> {
  const decorationTypes = new Map();
  if (config === undefined) {
    return decorationTypes;
  }
  lcovFile.lines.details.forEach((lcovLine) => {
    let branches = lcovFile.branches.details.filter((branch) => {
      return lcovLine.line === branch.line;
    });
    let decorationType = createDecorationType(lcovLine, branches, config);
    decorationTypes.set(lcovLine, decorationType);
  });
  return decorationTypes;
}

function getDecorationType(
  config: Config,
  colorConfig: ColorConfig
): vscode.TextEditorDecorationType {
  let options: vscode.DecorationRenderOptions = {};
  if (config.coverageConfig.displayInEditor) {
    options.backgroundColor = colorConfig.color;
  }
  if (config.coverageConfig.displayInGutter) {
    options.gutterIconPath = colorConfig.iconPath;
  }
  return vscode.window.createTextEditorDecorationType(options);
}
