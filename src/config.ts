import * as vscode from "vscode";
import { custom } from "./log";
import { getIconPath as getIconPath } from "./gutterIcon";

export interface ColorConfig {
  color: string;
  iconPath: string;
}

interface CoverageConfig {
  displayInEditor: boolean;
  displayInGutter: boolean;
  branchCoverage: boolean;
}

export interface Config {
  coveredColor: ColorConfig;
  uncoveredColor: ColorConfig;
  branchColor: ColorConfig;
  coverageConfig: CoverageConfig;
}

export function getConfig(): Config {
  let [coveredColor, uncoveredColor, branchColor] = getColors();

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
    coverageConfig: getCoverageConfig(),
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

function getCoverageConfig(): CoverageConfig {
  const configConfig = vscode.workspace.getConfiguration(
    "code-coverage-lcov.config"
  );

  let displayInEditor = configConfig.get<boolean>("displayInEditor");
  let displayInGutter = configConfig.get<boolean>("displayInGutter");
  let branchCoverage = configConfig.get<boolean>("branchCoverage");
  if (
    branchCoverage === undefined ||
    displayInEditor === undefined ||
    displayInGutter === undefined
  ) {
    custom.error(
      "Unable to read coverage config configuration. Proceed with default coverage config"
    );
    displayInEditor = true;
    displayInGutter = false;
    branchCoverage = true;
  }

  return {
    displayInEditor: displayInEditor,
    displayInGutter: displayInGutter,
    branchCoverage: branchCoverage,
  };
}
