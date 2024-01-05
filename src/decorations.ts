import * as vscode from "vscode";
import { LcovBranch, LcovFile, LcovLine } from "lcov-parse";
import { makePathsAbsolute, readLcovFile } from "./lcov";

const filePathMap = new Map<
  string,
  Map<LcovLine, vscode.TextEditorDecorationType>
>();

export async function disableDecorations() {
  const files = await vscode.workspace.findFiles("**/*");
  removeUsedDecorationTypes(files);
}

export async function applyCoverage(path: string) {
  const colorConfig = vscode.workspace.getConfiguration(
    "code-coverage-lcov.color"
  );
  const configConfig = vscode.workspace.getConfiguration(
    "code-coverage-lcov.config"
  );

  const coveredColor: string | undefined = colorConfig.get("covered");
  const uncoveredColor: string | undefined = colorConfig.get("uncovered");
  const branchColor: string | undefined = colorConfig.get("branch");
  const branchCoverageEnabled: boolean =
    configConfig.get("branchCoverage") ?? false;

  if (!coveredColor || !uncoveredColor || !branchColor) {
    vscode.window.showErrorMessage("Unable to highlighting colors.");
    return;
  }

  const files = await vscode.workspace.findFiles("**/*");
  removeUsedDecorationTypes(files).then(() => {
    readLcovFile(path).then((lcov) => {
      makePathsAbsolute(lcov);
      createDecorationTypes(
        lcov,
        coveredColor,
        uncoveredColor,
        branchColor,
        branchCoverageEnabled
      );
      applyDecorationTypes(files);
    });
  });
}

async function removeUsedDecorationTypes(files: vscode.Uri[]) {
  if (filePathMap.size === 0) {
    return;
  }
  let openTextDocumentPromises = files.map(async (file) => {
    try {
      if (!filePathMap.has(file.path)) {
        return;
      }
      const document = await vscode.workspace.openTextDocument(file);
      vscode.window.visibleTextEditors
        .filter((editor) => editor.document === document)
        .forEach((editor) => {
          let traceDecorationTypeMap = filePathMap.get(document.fileName);
          if (traceDecorationTypeMap) {
            traceDecorationTypeMap.forEach((decorationType) => {
              editor.setDecorations(decorationType, []);
            });
          }
        });
    } catch (e) {
      vscode.window.showErrorMessage(
        `Unable to open file ${file}. Exception: ${e}`
      );
    }
  });
  await Promise.all(openTextDocumentPromises);
  filePathMap.clear();
}

function createDecorationTypes(
  lcovFiles: LcovFile[],
  coveredColor: string,
  uncoveredColor: string,
  branchColor: string,
  branchCoverageEnabled: boolean
) {
  lcovFiles.forEach((file) => {
    file.lines.details.forEach((lcovLine) => {
      let branches = file.branches.details.filter((branch) => {
        return lcovLine.line === branch.line;
      });
      if (filePathMap.has(file.file)) {
        const innerMap = filePathMap.get(file.file) as Map<
          LcovLine,
          vscode.TextEditorDecorationType
        >;
        innerMap.set(
          lcovLine,
          createDecorationType(
            lcovLine,
            branches,
            coveredColor,
            uncoveredColor,
            branchColor,
            branchCoverageEnabled
          )
        );
      } else {
        const innerMap = new Map<LcovLine, vscode.TextEditorDecorationType>();
        innerMap.set(
          lcovLine,
          createDecorationType(
            lcovLine,
            branches,
            coveredColor,
            uncoveredColor,
            branchColor,
            branchCoverageEnabled
          )
        );
        filePathMap.set(file.file, innerMap);
      }
    });
  });
}

async function applyDecorationTypes(files: vscode.Uri[]) {
  let openTextDocumentPromises = files.map(async (file) => {
    if (!filePathMap.has(file.path)) {
      return;
    }
    try {
      const document = await vscode.workspace.openTextDocument(file);
      vscode.window.visibleTextEditors
        .filter((editor) => editor.document === document)
        .forEach((editor) => {
          applyDecorationTypesOnEditor(editor);
        });
    } catch (e) {
      vscode.window.showErrorMessage(
        `Unable to open file ${file}. Exception: ${e}`
      );
    }
  });
  await Promise.all(openTextDocumentPromises);
}

function createDecorationType(
  line: LcovLine,
  branches: Array<LcovBranch>,
  coveredColor: string,
  uncoveredColor: string,
  branchColor: string,
  branchCoverageEnabled: boolean
): vscode.TextEditorDecorationType {
  // return uncovored
  if (line.hit === 0) {
    return vscode.window.createTextEditorDecorationType({
      backgroundColor: uncoveredColor,
    });
  }

  // return all covored
  if (
    branches.every((branch) => {
      return branch.taken > 0;
    }) ||
    !branchCoverageEnabled
  ) {
    return vscode.window.createTextEditorDecorationType({
      backgroundColor: coveredColor,
    });
  }

  // return branch covored
  return vscode.window.createTextEditorDecorationType({
    backgroundColor: branchColor,
  });
}

export async function applyDecorationTypesOnEditor(editor: vscode.TextEditor) {
  let traceDecorationTypeMap = filePathMap.get(editor.document.fileName);
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
