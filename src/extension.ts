import * as vscode from "vscode";
import {
  applyCoverage,
  applyDecorationTypesOnEditor,
  disableDecorations,
} from "./decorations";
import { addStatusBar, removeStatusBar, updateStatusBar } from "./statusBar";
import { CommandDisplay, CommandHide } from "./commands";
import {
  watchReport as activateWatchReport,
  disableReportWatcher,
} from "./lcovReport";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(CommandDisplay, () => {
      activateWatchReport();
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
  disableReportWatcher();
  removeStatusBar();
}
