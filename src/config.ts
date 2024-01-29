import * as vscode from "vscode";

export interface Config {
  coveredColor: string;
  uncoveredColor: string;
  branchColor: string;
  branchCoverageEnabled: boolean;
}

export function getConfig(): Config | undefined {
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
    return undefined;
  }
  return {
    coveredColor: coveredColor,
    uncoveredColor: uncoveredColor,
    branchColor: branchColor,
    branchCoverageEnabled: branchCoverageEnabled,
  };
}
