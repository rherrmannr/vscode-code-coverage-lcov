import parse, { LcovFile } from "lcov-parse";
import * as fs from "fs";

export function readLcovFile(filePath: string): Promise<LcovFile[]> {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, "utf-8", (err, data) => {
      if (err) {
        reject(err);
        return;
      }
      parse(filePath, (error, data) => {
        if (error) {
          reject(error);
          return;
        }
        if (data === undefined) {
          reject();
          return;
        }
        resolve(data);
      });
    });
  });
}
