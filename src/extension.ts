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
  const rustFiles = await vscode.workspace.findFiles("**/*.rs");
  removeUsedDecorationTypes(rustFiles);
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
  //process the data here
  const rustFiles = await vscode.workspace.findFiles("**/*.rs");
  removeUsedDecorationTypes(rustFiles).then(() => {
    readLcovFile(path).then((lcov) => {
      createDecorationTypes(lcov);
      applyDecorationTypes(rustFiles);
    });
  });
}

async function removeUsedDecorationTypes(rustFiles: vscode.Uri[]) {
  if (filePathMap.size === 0) {
    return;
  }
  let openTextDocumentPromises = rustFiles.map(async (rustFile) => {
    const document = await vscode.workspace.openTextDocument(rustFile);
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
  });
  await Promise.all(openTextDocumentPromises);
  filePathMap.clear();
}

function createDecorationTypes(lcovFiles: LcovFile[]) {
  lcovFiles.forEach((file) => {
    file.lines.details.forEach((lcovLine) => {
      if (filePathMap.has(file.file)) {
        const innerMap = filePathMap.get(file.file) as Map<
          LcovLine,
          vscode.TextEditorDecorationType
        >;
        innerMap.set(lcovLine, createDecorationType(lcovLine));
      } else {
        const innerMap = new Map<LcovLine, vscode.TextEditorDecorationType>();
        innerMap.set(lcovLine, createDecorationType(lcovLine));
        filePathMap.set(file.file, innerMap);
      }
    });
  });
}

async function applyDecorationTypes(rustFiles: vscode.Uri[]) {
  let openTextDocumentPromises = rustFiles.map(async (rustFile) => {
    const document = await vscode.workspace.openTextDocument(rustFile);
    vscode.window.visibleTextEditors
      .filter((editor) => editor.document === document)
      .forEach((editor) => {
        applyDecorationTypesOnEditor(editor);
      });
  });
  await Promise.all(openTextDocumentPromises);
}

function createDecorationType(line: LcovLine): vscode.TextEditorDecorationType {
  return vscode.window.createTextEditorDecorationType({
    backgroundColor:
      line.hit === 0
        ? "rgba(255, 0, 0, 0.2)" // Light red for uncovered lines
        : "rgba(144, 238, 144, 0.2)", // Light green for covered lines
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
