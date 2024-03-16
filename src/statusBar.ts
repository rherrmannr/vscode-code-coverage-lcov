import * as vscode from "vscode";
import { CommandDisplay, CommandHide, CommandToggle } from "./commands";

let isCodeCoverageVisible = false;
let statusBarItem: vscode.StatusBarItem;

const HideCoverage: string = "$(eye-closed) Hide Code Coverage";
const ShowCoverage: string = "$(eye) Show Code Coverage";

export function addStatusBar(context: vscode.ExtensionContext) {
  statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );

  statusBarItem.text = ShowCoverage;
  statusBarItem.tooltip = "Click to toggle Code Coverage visibility";

  statusBarItem.show();

  const toggleCommand = vscode.commands.registerCommand(CommandToggle, () => {
    isCodeCoverageVisible = !isCodeCoverageVisible;

    if (isCodeCoverageVisible) {
      vscode.commands.executeCommand(CommandDisplay).then(() => {
        statusBarItem.text = HideCoverage;
      });
    } else {
      statusBarItem.text = ShowCoverage;
      vscode.commands.executeCommand(CommandHide);
    }
  });

  context.subscriptions.push(toggleCommand);
  statusBarItem.command = CommandToggle;

  context.subscriptions.push(statusBarItem);
}

export function removeStatusBar() {
  statusBarItem.dispose();
}

export function updateStatusBar(visible: boolean) {
  if (isCodeCoverageVisible === visible) {
    return;
  }
  isCodeCoverageVisible = visible;
  if (isCodeCoverageVisible) {
    statusBarItem.text = HideCoverage;
  } else {
    statusBarItem.text = ShowCoverage;
  }
}
