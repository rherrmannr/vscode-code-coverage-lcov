# Code Coverage LCOV - Visual Studio Code Extension

## Overview

Code Coverage LCOV is a Visual Studio Code extension that helps you visualize code coverage information from lcov files directly in your editor. The extension provides commands and configuration options to customize the display of covered and uncovered lines, as well as branch coverage.

![Code Coverage LCOV](https://github.com/rherrmannr/vscode-code-coverage-lcov/raw/master/media/preview.gif)

## Features

### Commands

- **Display**: `code-coverage-lcov.display`
  - Opens the coverage visualization in the editor.

- **Hide**: `code-coverage-lcov.hide`
  - Hides the coverage visualization in the editor.

- **Toggle**: `code-coverage-lcov.toggle`
  - Toggles the visibility of the coverage visualization.

### Configuration

The extension comes with the following configuration options:

- **Color for Covered Lines**: `code-coverage-lcov.color.covered`
  - Specifies the color for covered lines. Default: Green `rgba(50, 205, 50, 0.2)`.

- **Color for Uncovered Lines**: `code-coverage-lcov.color.uncovered`
  - Specifies the color for uncovered lines. Default: Red `rgba(255, 0, 0, 0.2)`.

- **Color for Branches**: `code-coverage-lcov.color.branch`
  - Specifies the color for uncovered branches. Default: Yellow `rgba(255, 255, 0, 0.2)`.

- **Show Coverage in Editor**: `code-coverage-lcov.config.displayInEditor`
  - Specifies wether to show code coverage in the editor. Default: `true`.

- **Show Coverage in Gutter**: `code-coverage-lcov.config.displayInGutter`
  - Specifies wether to show code coverage in the gutter. Default: `false`.

- **Search Path for LCOV File**: `code-coverage-lcov.path.searchPath`
  - Search path to the lcov file. Default: `**/lcov*`.

- **Show Branch Coverage**: `code-coverage-lcov.config.branchCoverage`
  - Specifies whether to show branch coverage. Default: `true`.

## Usage

1. **Search for LCOV Files:**
   - The extension searches for lcov files based on the specified search path (`**/lcov*`). You can customize this path in the extension settings.

2. **Display Coverage Information:**
   - Use the `Code Coverage LCOV: Display` (`code-coverage-lcov.display`) command to open the coverage visualization in the editor.

3. **Hide Coverage Information:**
   - Use the `Code Coverage LCOV: Hide` (`code-coverage-lcov.hide`) command to hide the coverage visualization in the editor.
  
4. **Toggle Coverage Information:**
   - Use the `Code Coverage LCOV: Toggle` (`code-coverage-lcov.toggle`) toggle the visibility of the coverage information.

5. **Toggle Button:**
   - An button is available for toggling coverage, displaying either `Hide Code Coverage` or `Show Code Coverage` depending on the current state.

6. **Automatic Updates:**
   - The extension watches the lcov file, automatically updating the coverage information when a new coverage report is created.

7. **Branch Coverage:**
   - Branch coverage can be enabled or disabled using the `code-coverage-lcov.config.branchCoverage` configuration option.

### Coverage Display Options

#### Enable Coverage in Editor:
 By default, the extension will display coverage information within the editor. You can control this behavior using the `code-coverage-lcov.config.displayInEditor` configuration option.

#### Enable Coverage in Gutter:
To display code coverage in the gutter, set the `code-coverage-lcov.config.displayInGutter` configuration option to true.  
![Coverage In Gutter](https://github.com/rherrmannr/vscode-code-coverage-lcov/raw/master/media/gutter.png)

Both the editor and gutter coverage displays can be used independently and can be active at the same time, providing flexible options for visualizing code coverage in your workspace.

## Notes

- As set in the searchPath, the extension searches for lcov files. You can also set absolute or other paths in the extension settings.

- Branch coverage is enabled by default, but you can customize this in the extension settings. Branch coverage can only be displayed if the generated lcov file contains coverage information

## Supported Languages

Code Coverage LCOV works seamlessly with code coverage tools that generate lcov files. Feel free to explore other code coverage tools for your preferred programming languages, and if they generate lcov files, chances are they can be visualized using Code Coverage LCOV in Visual Studio Code.

## License

This extension is licensed under the [MIT License](LICENSE). Feel free to contribute or report issues on the [GitHub repository](https://github.com/rherrmannr/vscode-code-coverage-lcov).

Enjoy coding with enhanced code coverage visualization in Visual Studio Code!