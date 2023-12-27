import * as vscode from "vscode";
import { Trace, TarpulinData } from "./interfaces/ITarpulin";
import fs from "fs";
import * as chokidar from "chokidar";

const filePathMap = new Map<
  string,
  Map<Trace, vscode.TextEditorDecorationType>
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
    console.log("Visible editor:", editor.document.fileName);
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
  const fileName = "tarpaulin-report.json";
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
  console.log("parse json from path: ", path);
  const jsonData = fs.readFileSync(path, "utf-8");
  const tarpulin: TarpulinData = JSON.parse(jsonData);
  const rustFiles = await vscode.workspace.findFiles("**/*.rs");

  removeUsedDecorationTypes(rustFiles).then(() => {
    createDecorationTypes(tarpulin);
    applyDecorationTypes(rustFiles);
  });
}

async function removeUsedDecorationTypes(rustFiles: vscode.Uri[]) {
  let openTextDocumentPromises = rustFiles.map(async (rustFile) => {
    const document = await vscode.workspace.openTextDocument(rustFile);
    vscode.window.visibleTextEditors
      .filter((editor) => editor.document === document)
      .forEach((editor) => {
        console.log(
          "remove decoration types from visible rust editor: ",
          document.fileName
        );

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

function createDecorationTypes(tarpulin: TarpulinData) {
  tarpulin.files.forEach((file) => {
    let path = "/" + file.path.slice(1).join("/");
    file.traces.forEach((trace) => {
      if (filePathMap.has(path)) {
        const innerMap = filePathMap.get(path) as Map<
          Trace,
          vscode.TextEditorDecorationType
        >;
        innerMap.set(trace, createDecorationType(trace));
      } else {
        const innerMap = new Map<Trace, vscode.TextEditorDecorationType>();
        innerMap.set(trace, createDecorationType(trace));
        filePathMap.set(path, innerMap);
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

function createDecorationType(trace: Trace): vscode.TextEditorDecorationType {
  return vscode.window.createTextEditorDecorationType({
    backgroundColor:
      trace.stats.Line === 0
        ? "rgba(255, 0, 0, 0.2)" // Light red for uncovered lines
        : "rgba(144, 238, 144, 0.2)", // Light green for covered lines
  });
}

async function applyDecorationTypesOnEditor(editor: vscode.TextEditor) {
  let traceDecorationTypeMap = filePathMap.get(editor.document.fileName);
  if (!traceDecorationTypeMap) {
    return;
  }
  console.log("apply decoration types on editor: ", editor.document.fileName);

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
