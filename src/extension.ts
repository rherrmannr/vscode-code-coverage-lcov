import * as vscode from "vscode";
import * as chokidar from "chokidar";
import {
  applyCoverage,
  applyDecorationTypesOnEditor,
  disableDecorations,
} from "./decorations";
import { addStatusBar, removeStatusBar, updateStatusBar } from "./statusBar";
import { CommandDisplay, CommandHide } from "./commands";

let watcher: chokidar.FSWatcher | null = null;

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(CommandDisplay, () => {
      watchReport();
      updateStatusBar(true);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(CommandHide, () => {
      disableDecorations();
      updateStatusBar(false);
    })
  );

  vscode.window.onDidChangeVisibleTextEditors(
    onDidChangeVisibleTextEditors,
    null,
    context.subscriptions
  );

  addStatusBar(context);
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
  watcher?.close();
  removeStatusBar();
}

export function watchReport() {
  const fileName = "lcov";
  vscode.workspace.findFiles(`**/${fileName}*`).then((files) => {
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
  watcher = chokidar.watch(filePath);
  watcher.on("change", (path) => {
    applyCoverage(path);
  });
  watcher.on("error", (error) => {
    console.error(`Error watching file: ${error}`);
  });
}
