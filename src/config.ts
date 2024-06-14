import * as vscode from "vscode";
import { custom } from "./log";
import { getIconPath as getIconPath } from "./gutterIcon";

interface ColorConfig {
  color: string;
  iconPath: string;
}

export interface Config {
  coveredColor: ColorConfig;
  uncoveredColor: ColorConfig;
  branchColor: ColorConfig;
  branchCoverageEnabled: boolean;
}

export function getConfig(): Config {
  const colorConfig = vscode.workspace.getConfiguration(
    "code-coverage-lcov.color"
  );
  const configConfig = vscode.workspace.getConfiguration(
    "code-coverage-lcov.config"
  );

  var coveredColor: string | undefined = colorConfig.get("covered");
  var uncoveredColor: string | undefined = colorConfig.get("uncovered");
  var branchColor: string | undefined = colorConfig.get("branch");
  var branchCoverageEnabled: boolean | undefined =
    configConfig.get("branchCoverage");

  if (
    !coveredColor ||
    !uncoveredColor ||
    !branchColor ||
    !branchCoverageEnabled
  ) {
    custom.error("Unable to read configuration. Proceed with default values");
    coveredColor = "rgba(50, 205, 50, 0.2)";
    uncoveredColor = "rgba(255, 0, 0, 0.2)";
    branchColor = "rgba(255, 255, 0, 0.2)";
    branchCoverageEnabled = true;
  }

  return {
    coveredColor: {
      color: coveredColor,
      iconPath: getIconPath(coveredColor),
    },
    uncoveredColor: {
      color: uncoveredColor,
      iconPath: getIconPath(uncoveredColor),
    },
    branchColor: {
      color: branchColor,
      iconPath: getIconPath(branchColor),
    },
    branchCoverageEnabled: branchCoverageEnabled,
  };
}
