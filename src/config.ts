import * as vscode from "vscode";
import { custom } from "./log";

export interface Config {
  coveredColor: string;
  uncoveredColor: string;
  branchColor: string;
  branchCoverageEnabled: boolean;
}

export function getConfig(): Config {
  const colorConfig = vscode.workspace.getConfiguration(
    "code-coverage-lcov.color"
  );
  const configConfig = vscode.workspace.getConfiguration(
    "code-coverage-lcov.config"
  );

  const coveredColor: string | undefined = colorConfig.get("covered");
  const uncoveredColor: string | undefined = colorConfig.get("uncovered");
  const branchColor: string | undefined = colorConfig.get("branch");
  const branchCoverageEnabled: boolean | undefined =
    configConfig.get("branchCoverage");

  if (
    !coveredColor ||
    !uncoveredColor ||
    !branchColor ||
    !branchCoverageEnabled
  ) {
    custom.error("Unable to read configuration. Proceed with default values");
    return {
      coveredColor: "rgba(50, 205, 50, 0.2)",
      uncoveredColor: "rgba(255, 0, 0, 0.2)",
      branchColor: "rgba(255, 255, 0, 0.2)",
      branchCoverageEnabled: true,
    };
  }

  return {
    coveredColor: coveredColor,
    uncoveredColor: uncoveredColor,
    branchColor: branchColor,
    branchCoverageEnabled: branchCoverageEnabled,
  };
}
