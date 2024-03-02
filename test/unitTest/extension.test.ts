import * as assert from "assert";

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from "vscode";
import { getConfig } from "../../src/config";
import sinon from "sinon";
// import * as myExtension from '../../extension';

suite("Config Test Suite", () => {
  vscode.window.showInformationMessage("Start all tests.");

  test("Default Values Test", () => {
    // given
    // when
    let config = getConfig();

    // then
    assert.strictEqual("rgba(50, 205, 50, 0.2)", config?.coveredColor);
    assert.strictEqual("rgba(255, 0, 0, 0.2)", config?.uncoveredColor);
    assert.strictEqual("rgba(255, 255, 0, 0.2)", config?.branchColor);
    assert.strictEqual("true", config?.branchCoverageEnabled);
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
    assert.strictEqual(true, config?.branchCoverageEnabled);
  });
});
