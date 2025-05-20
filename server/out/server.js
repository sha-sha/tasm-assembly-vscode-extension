"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const lexer_1 = __importDefault(require("./lexer")); // Import your lexer here
// Create a connection for the server. The server uses Node's IPC
// mechanism. The connection is created via stdin/stdout.
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
// Create a simple text document manager.
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
connection.onInitialize((params) => {
    const capabilities = params.capabilities;
    // Does the client support the `workspace/configuration` request?
    // If not, we fall back to asking server-side for activation parameter.
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
    hasDiagnosticRelatedInformationCapability = !!(capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation);
    const result = {
        capabilities: {
            textDocumentSync: node_1.TextDocumentSyncKind.Incremental,
            // Tell the client that the server supports code completion
            // completionProvider: {
            //     resolveProvider: true // We will not resolve completion items here
            // },
            // Tell the client that the server supports hover
            // hoverProvider: true,
            // Tell the client that the server supports goto definition
            // definitionProvider: true,
            // Tell the client that the server supports diagnostics
            // We will implement diagnostics later
        }
    };
    if (hasWorkspaceFolderCapability) {
        result.capabilities.workspace = {
            workspaceFolders: {
                supported: true
            }
        };
    }
    return result;
});
connection.onInitialized(() => {
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(node_1.DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log('Workspace folder change event received.');
        });
    }
});
// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the vscode-languageclient
// but could be the case when using it with other clients.
const defaultSettings = { maxNumberOfProblems: 1000 };
let globalSettings = defaultSettings;
// Cache the settings of all open documents
const documentSettings = new Map();
connection.onDidChangeConfiguration(change => {
    if (hasConfigurationCapability) {
        // Clear all cached document settings
        documentSettings.clear();
    }
    else {
        globalSettings = ((change.settings.languageServerExample || defaultSettings));
    }
    // Revalidate all open text documents
    documents.all().forEach(validateTextDocument);
});
function getDocumentSettings(resource) {
    if (!hasConfigurationCapability) {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);
    if (!result) {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: 'languageServerExample'
        });
        documentSettings.set(resource, result);
    }
    return result;
}
// Only keep settings for open documents
documents.onDidClose(e => {
    documentSettings.delete(e.document.uri);
});
// This handler provides the initial list of the completion items.
// connection.onCompletion(
//     (_textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
//         // The passed parameter contains the position of the text document in
//         // which code complete got requested. For the example we ignore this
//         // info and always provide the same completion items.
//         return [
//             {
//                 label: 'TASM_Directive',
//                 kind: CompletionItemKind.Text,
//                 data: 1
//             },
//             {
//                 label: 'TASM_Instruction',
//                 kind: CompletionItemKind.Text,
//                 data: 2
//             }
//         ];
//     }
// );
// This handler resolves additional information for the selected completion item.
// connection.onCompletionResolve(
//     (item: CompletionItem): CompletionItem => {
//         if (item.data === 1) {
//             item.detail = 'TASM Directive Detail';
//             item.documentation = 'Documentation for TASM Directive';
//         } else if (item.data === 2) {
//             item.detail = 'TASM Instruction Detail';
//             item.documentation = 'Documentation for TASM Instruction';
//         }
//         return item;
//     }
// );
// Listen for text document changes
documents.onDidChangeContent(change => {
    validateTextDocument(change.document);
});
function validateTextDocument(textDocument) {
    return __awaiter(this, void 0, void 0, function* () {
        // In this simple example we get the settings for every validate run.
        const settings = yield getDocumentSettings(textDocument.uri);
        // The validator creates diagnostics for all uppercase words length 2 and more
        const text = textDocument.getText();
        const problems = 0;
        const diagnostics = [];
        const lexer = new lexer_1.default(text);
        while (true) {
            const token = lexer.getNextToken();
            if (token === null) {
                break;
            }
            connection.console.log(`token: ${token.type}, lexeme: ${token.lexeme}, literal: ${token.literal}, line: ${token.line}`);
        }
        // --- TASM Specific Validation Logic Goes Here ---
        // You will need to implement a parser or simple regex checks
        // to find errors, warnings, etc. in the TASM code.
        // For example, a simple check for a common error: misplaced directive
        const lines = text.split(/\r?\n/);
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Example: Check for '.MODEL' directive not at the start of the file (very basic)
            if (i > 0 && line.trim().startsWith('.MODEL')) {
                connection.console.log(`xxxError: .MODEL directive found at line ${i + 1} but should be at the start.`);
                diagnostics.push({
                    severity: node_1.DiagnosticSeverity.Error,
                    range: {
                        start: { line: i, character: line.indexOf('.MODEL') },
                        end: { line: i, character: line.indexOf('.MODEL') + '.MODEL'.length }
                    },
                    message: `.MODEL directive should typically be at the beginning of the file.`,
                    source: 'tasm-language-server'
                });
            }
            // Add more TASM specific checks here...
            // Example: Check for invalid instruction format (placeholder)
            // This would require parsing the line to identify instructions and operands
            // if (isInvalidInstruction(line)) {
            //      diagnostics.push({ ... });
            // }
        }
        // Send the computed diagnostics to VS Code.
        connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
    });
}
documents.onDidOpen((event) => {
    connection.console.log(`Document opened: ${event.document.uri}`);
    validateTextDocument(event.document);
});
documents.onDidSave((event) => {
    connection.console.log(`Document saved:, ${event.document.uri}`);
    validateTextDocument(event.document);
});
connection.onShutdown(() => {
    // Clean up resources if necessary
});
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// Listen on the connection
connection.listen();
