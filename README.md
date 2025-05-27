# TASM Assembly Language Support for Visual Studio Code

[![Version](https://img.shields.io/vscode-marketplace/v/YourPublisherName.tasm-assembly-language-support)](https://marketplace.visualstudio.com/items?itemName=YourPublisherName.tasm-assembly-language-support)
[![Installs](https://img.shields.io/vscode-marketplace/i/YourPublisherName.tasm-assembly-language-support)](https://marketplace.visualstudio.com/items?itemName=YourPublisherName.tasm-assembly-language-support)
[![Rating](https://img.shields.io/vscode-marketplace/r/YourPublisherName.tasm-assembly-language-support)](https://marketplace.visualstudio.com/items?itemName=YourPublisherName.tasm-assembly-language-support)
[![License](https://img.shields.io/github/license/sha-sha/tasm-assembly-vscode-extension)](https://github.com/YourUsername/tasm-assembly-vscode-extension/blob/main/LICENSE)


This extension provides comprehensive language support for TASM (Turbo Assembler) within Visual Studio Code. Enhance your TASM development experience with features like syntax highlighting, IntelliSense (code completion and suggestions), and more (future features can be listed here).

## Features

* **Syntax Highlighting:** Enjoy clear and consistent syntax highlighting for TASM assembly code, making it easier to read and understand.
* **Error Checking and Diagnostics:** (If implemented) Identify syntax errors and potential issues directly in the editor.

### Under development:

* **IntelliSense:**
    * **Code Completion:** Get suggestions for keywords, directives, registers, and labels as you type.
    * **Parameter Hints:** (If implemented) See parameter information for instructions and directives.
    * **Go to Definition:** (If implemented) Navigate directly to the definition of labels and symbols.
* **Language Configuration:** Provides proper commenting and bracket matching.

## Requirements

* [Visual Studio Code](https://code.visualstudio.com/) version ^1.100.0 or higher.

## Installation

1.  Open Visual Studio Code.
2.  Go to the Extensions view (`Ctrl+Shift+X` or `Cmd+Shift+X`).
3.  Search for `TASM Assembly Language Support`
4.  Click the "Install" button.

## Usage

Once installed, the extension will automatically activate when you open or create files with the following extensions:

* `.asm`

You can also manually set the language mode for a file to "TASM Assembly" by:

1.  Opening the file in VS Code.
2.  Clicking on the language identifier in the bottom right corner of the status bar (it might say "Plain Text" or another language).
3.  In the language selection menu, search for and select "TASM Assembly".

## Extension Settings

### Under development

(Add any specific settings your extension provides here. For example, if you have a setting to control the language server trace level):

This extension contributes the following settings:

* `tasmAssembly.server.trace.server`: Controls the verbosity of the communication between VS Code and the language server. Options: `"off"`, `"messages"`, `"verbose"`. Default: `"off"`.

    To modify these settings, go to:
    * `File` > `Preferences` > `Settings` (Windows/Linux) or
    * `Code` > `Preferences` > `Settings` (macOS)
    * Search for `TASM Assembly`.

## Known Issues

* Basic syntax highlighting might not cover all advanced TASM directives yet.*

## Contributing

Contributions are welcome! If you find a bug, have a suggestion, or want to contribute new features, please feel free to:

1.  Fork the repository on [GitHub](https://github.com/sha-sha/tasm-assembly-vscode-extension).
2.  Create a new branch with a descriptive name (`git checkout -b feature/new-feature` or `git checkout -b bugfix/issue-123`).
3.  Make your changes and commit them (`git commit -am 'Add new feature or fix issue'`).
4.  Push your changes to your fork (`git push origin feature/new-feature`).
5.  Create a pull request on the main repository.

## License

This extension is licensed under the [MIT License](LICENSE) (or the license you specified in your `package.json`).

## Release Notes

### 0.0.1

* Initial release with basic syntax highlighting for TASM assembly.
* Implemented basic IntelliSense for keywords and registers.
* Added language configuration for commenting and bracket matching.


---

**Enjoy coding in TASM with Visual Studio Code!**