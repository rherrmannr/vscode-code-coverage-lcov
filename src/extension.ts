import * as vscode from "vscode";
import fs from "fs";
import * as chokidar from "chokidar";
import { LcovFile, LcovLine } from "lcov-parse";
import { readLcovFile } from "./lcov";

const filePathMap = new Map<
  string,
  Map<LcovLine, vscode.TextEditorDecorationType>
>();

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("code-coverage-lcov.display", () => {
      watchReport();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("code-coverage-lcov.hide", () => {
      disableDecorations();
    })
  );

  vscode.window.onDidChangeVisibleTextEditors(
    onDidChangeVisibleTextEditors,
    null,
    context.subscriptions
  );
}

export function onDidChangeVisibleTextEditors(
  editors: readonly vscode.TextEditor[]
) {
  for (const editor of editors) {
    applyDecorationTypesOnEditor(editor);
  }
}

export function deactivate() {
  disableDecorations();
}

async function disableDecorations() {
  const files = await vscode.workspace.findFiles("**/*");
  removeUsedDecorationTypes(files);
}

export function watchReport() {
  const fileName = "lcov.info";
  vscode.workspace.findFiles(`**/${fileName}`).then((files) => {
    if (files.length > 0) {
      const filePath = files[0].fsPath;
      applyCoverage(filePath);
      watchReportChange(filePath);
    } else {
      console.error(`File not found: ${fileName}`);
    }
  });
}

function watchReportChange(filePath: string): void {
  const watcher = chokidar.watch(filePath);
  watcher.on("change", (path) => {
    applyCoverage(path);
  });
  watcher.on("error", (error) => {
    console.error(`Error watching file: ${error}`);
  });
}

async function applyCoverage(path: string) {
  const config = vscode.workspace.getConfiguration("code-coverage-lcov.color");

  const coveredColor: string | undefined = config.get("covered");
  const uncoveredColor: string | undefined = config.get("uncovered");

  if (!coveredColor || !uncoveredColor) {
    console.error(
      "Unable to highlighting colors. covered: {}, uncovored: {}",
      coveredColor,
      uncoveredColor
    );
    return;
  }

  const files = await vscode.workspace.findFiles("**/*");
  removeUsedDecorationTypes(files).then(() => {
    readLcovFile(path).then((lcov) => {
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
      console.error(`Unable to open file ${file}. Exception: ${e}`);
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
      console.error(`Unable to open file ${file}. Exception: ${e}`);
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

async function applyDecorationTypesOnEditor(editor: vscode.TextEditor) {
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
