import * as assert from "assert";

import * as vscode from "vscode";
import { getConfig } from "../../src/config";
import sinon from "sinon";

suite("Config Test Suite", () => {
  test("Default Values Test", () => {
    // given
    // when
    let config = getConfig();

    // then
    assert.strictEqual("rgba(50, 205, 50, 0.2)", config?.coveredColor);
    assert.strictEqual("rgba(255, 0, 0, 0.2)", config?.uncoveredColor);
    assert.strictEqual("rgba(255, 255, 0, 0.2)", config?.branchColor);
    assert.strictEqual("true", config?.coverageConfig.branchCoverage);
  });

  test("Get Configuration Fails Test", () => {
    // given
    const getConfigurationStub = sinon.stub(
      vscode.workspace,
      "getConfiguration"
    );

    const getStub = sinon.stub();
    getStub.withArgs("covered").returns(undefined);
    getStub.withArgs("config").returns(undefined);

    getConfigurationStub.withArgs("code-coverage-lcov.color").returns({
      get: getStub,
    } as unknown as vscode.WorkspaceConfiguration);

    getConfigurationStub.withArgs("code-coverage-lcov.config").returns({
      get: getStub,
    } as unknown as vscode.WorkspaceConfiguration);

    // when
    let config = getConfig();

    getStub.reset();
    getConfigurationStub.restore();

    // then
    assert.strictEqual("rgba(50, 205, 50, 0.2)", config?.coveredColor);
    assert.strictEqual("rgba(255, 0, 0, 0.2)", config?.uncoveredColor);
    assert.strictEqual("rgba(255, 255, 0, 0.2)", config?.branchColor);
    assert.strictEqual(true, config?.coverageConfig.branchCoverage);
  });
});
