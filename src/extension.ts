import * as vscode from "vscode";
import { disableDecorations } from "./decorations";
import { addStatusBar, removeStatusBar } from "./statusBar";
import { CommandDisplay, CommandHide } from "./commands";
import {
  disableReportWatcher,
  executeDisplay,
  executeHide,
  onDidChangeVisibleTextEditors,
} from "./lcovReport";
import { custom } from "./log";

export function activate(context: vscode.ExtensionContext) {
  custom.log("Activate");

  context.subscriptions.push(
    vscode.commands.registerCommand(CommandDisplay, () => {
      return executeDisplay();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(CommandHide, () => {
      executeHide();
    })
  );

  vscode.window.onDidChangeVisibleTextEditors(
    onDidChangeVisibleTextEditors,
    null,
    context.subscriptions
  );

  addStatusBar(context);
}

export function deactivate() {
  custom.log("Deactivate");

  disableDecorations();
  disableReportWatcher();
  removeStatusBar();
}
