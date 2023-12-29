import * as vscode from "vscode";
import { LcovFile, LcovLine } from "lcov-parse";
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
  const config = vscode.workspace.getConfiguration("code-coverage-lcov.color");

  const coveredColor: string | undefined = config.get("covered");
  const uncoveredColor: string | undefined = config.get("uncovered");

  if (!coveredColor || !uncoveredColor) {
    vscode.window.showErrorMessage("Unable to highlighting colors.");
    return;
  }

  const files = await vscode.workspace.findFiles("**/*");
  removeUsedDecorationTypes(files).then(() => {
    readLcovFile(path).then((lcov) => {
      makePathsAbsolute(lcov);
      createDecorationTypes(lcov, coveredColor, uncoveredColor);
      applyDecorationTypes(files, coveredColor, uncoveredColor);
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
  uncoveredColor: string
) {
  lcovFiles.forEach((file) => {
    file.lines.details.forEach((lcovLine) => {
      if (filePathMap.has(file.file)) {
        const innerMap = filePathMap.get(file.file) as Map<
          LcovLine,
          vscode.TextEditorDecorationType
        >;
        innerMap.set(
          lcovLine,
          createDecorationType(lcovLine, coveredColor, uncoveredColor)
        );
      } else {
        const innerMap = new Map<LcovLine, vscode.TextEditorDecorationType>();
        innerMap.set(
          lcovLine,
          createDecorationType(lcovLine, coveredColor, uncoveredColor)
        );
        filePathMap.set(file.file, innerMap);
      }
    });
  });
}

async function applyDecorationTypes(
  files: vscode.Uri[],
  coveredColor: string,
  uncoveredColor: string
) {
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
  coveredColor: string,
  uncoveredColor: string
): vscode.TextEditorDecorationType {
  return vscode.window.createTextEditorDecorationType({
    backgroundColor: line.hit === 0 ? uncoveredColor : coveredColor,
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
