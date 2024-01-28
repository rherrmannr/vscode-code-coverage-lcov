import * as vscode from "vscode";
import { disableDecorations, applyCoverage } from "./decorations";
import { addStatusBar, removeStatusBar, updateStatusBar } from "./statusBar";
import { CommandDisplay, CommandHide } from "./commands";
import {
  activateWatchReport,
  disableReportWatcher,
  disableWatchReport,
  loadFilePath,
  resolveLCOVFile,
} from "./lcovReport";
import { custom } from "./log";

let display = false;

export function activate(context: vscode.ExtensionContext) {
  custom.log("Activate");

  loadFilePath().then(() => {
    resolveLCOVFile();
    context.subscriptions.push(
      vscode.commands.registerCommand(CommandDisplay, () => {
        display = true;
        activateWatchReport();
        updateStatusBar(display);
        applyCoverage();
      })
    );
    context.subscriptions.push(
      vscode.commands.registerCommand(CommandHide, () => {
        display = false;
        disableWatchReport();
        updateStatusBar(display);
      })
    );

    vscode.window.onDidChangeVisibleTextEditors(
      onDidChangeVisibleTextEditors,
      null,
      context.subscriptions
    );
  });

  addStatusBar(context);
}

export function onDidChangeVisibleTextEditors(
  editors: readonly vscode.TextEditor[]
) {
  if (display) {
    applyCoverage();
  }
}

export function deactivate() {
  custom.log("Deactivate");
  display = false;
  disableDecorations();
  disableReportWatcher();
  removeStatusBar();
}
