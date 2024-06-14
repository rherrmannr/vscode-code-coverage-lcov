import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

function generateSvgRectangle(color: string): string {
  return `
        <svg xmlns="http://www.w3.org/2000/svg" width="50%" height="100%">
            <rect width="50%" height="100%" style="fill:${color};" />
        </svg>
    `;
}

function getTempDirectoryPath(filename: string): string {
  return path.join(os.tmpdir(), filename);
}

export function getIconPath(color: string): string {
  const svgPath = getTempDirectoryPath(color + ".svg");
  if (!fs.existsSync(svgPath)) {
    const svg = generateSvgRectangle(color);
    fs.writeFileSync(svgPath, svg);
  }
  return svgPath;
}
