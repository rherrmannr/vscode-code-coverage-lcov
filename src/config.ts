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
  let [coveredColor, uncoveredColor, branchColor] = getColors();
  let branchCoverageEnabled = getCoverageEnabled();

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

function getColors(): [string, string, string] {
  const colorConfig = vscode.workspace.getConfiguration(
    "code-coverage-lcov.color"
  );

  let coveredColor = colorConfig.get<string>("covered");
  let uncoveredColor = colorConfig.get<string>("uncovered");
  let branchColor = colorConfig.get<string>("branch");
  if (!coveredColor || !uncoveredColor || !branchColor) {
    custom.error(
      "Unable to read color configuration. Proceed with default colors"
    );
    coveredColor = "rgba(50, 205, 50, 0.2)";
    uncoveredColor = "rgba(255, 0, 0, 0.2)";
    branchColor = "rgba(255, 255, 0, 0.2)";
  }
  return [coveredColor, uncoveredColor, branchColor];
}

function getCoverageEnabled(): boolean {
  const configConfig = vscode.workspace.getConfiguration(
    "code-coverage-lcov.config"
  );

  let branchCoverageEnabled = configConfig.get<boolean>("branchCoverage");
  if (!branchCoverageEnabled) {
    custom.error(
      "Unable to read config configuration. Proceed with default config"
    );
    branchCoverageEnabled = true;
  }

  return branchCoverageEnabled;
}
