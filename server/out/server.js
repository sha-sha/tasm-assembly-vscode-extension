"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const vscode_uri_1 = require("vscode-uri");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const path = __importStar(require("path"));
const lexer_1 = __importDefault(require("./lexer")); // Import your lexer here
const token_1 = require("./token");
// Create a connection for the server. The server uses Node's IPC
// mechanism. The connection is created via stdin/stdout.
const connection = (0, node_1.createConnection)(node_1.ProposedFeatures.all);
// Create a simple text document manager.
const documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;
// Cache for workspace folders
let workspaceFoldersCache = null;
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
function getRelativePath(uri) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const textDocumentUri = vscode_uri_1.URI.parse(uri);
            const textDocumentFsPath = textDocumentUri.fsPath;
            const currentWorkspaceFolders = workspaceFoldersCache || (yield connection.workspace.getWorkspaceFolders());
            if (!currentWorkspaceFolders || currentWorkspaceFolders.length === 0) {
                connection.console.warn(`No workspace folders available. Cannot determine relative path for ${textDocumentFsPath}.`);
                // Handle case where the file might not be part of a defined workspace folder
                // You might treat its own directory as a "root" or skip relative path calculation
                return null;
            }
            // Find the workspace folder that contains the changed document
            // We are looking for the root folder whose path is a prefix of the document's path.
            // If multiple roots could match (e.g. nested), typically the longest match is the most specific.
            let bestMatchingRoot = null;
            for (const folder of currentWorkspaceFolders) {
                const folderUri = vscode_uri_1.URI.parse(folder.uri);
                const folderFsPath = folderUri.fsPath;
                if (textDocumentFsPath.startsWith(folderFsPath + path.sep) || textDocumentFsPath === folderFsPath) {
                    // If it's a better (more specific/longer) match than a previous one
                    if (!bestMatchingRoot || folderFsPath.length > vscode_uri_1.URI.parse(bestMatchingRoot.uri).fsPath.length) {
                        bestMatchingRoot = folder;
                    }
                }
            }
            if (bestMatchingRoot) {
                const rootFolderFsPath = vscode_uri_1.URI.parse(bestMatchingRoot.uri).fsPath;
                const relativePath = path.relative(rootFolderFsPath, textDocumentFsPath);
                connection.console.log(`Changed document absolute path: ${textDocumentFsPath}`);
                connection.console.log(`Project root folder: ${rootFolderFsPath}`);
                connection.console.log(`Path relative to project root: ${relativePath}`);
                return textDocumentFsPath;
            }
            else {
                connection.console.warn(`Changed document ${textDocumentFsPath} is not within any known workspace folder.`);
                // Handle files opened from outside the workspace folders
            }
        }
        catch (error) {
            connection.console.error(`Error processing didChangeContent for ${uri}: ${error}`);
        }
        return null;
    });
}
function validateTextDocument(textDocument) {
    return __awaiter(this, void 0, void 0, function* () {
        // In this simple example we get the settings for every validate run.
        const settings = yield getDocumentSettings(textDocument.uri);
        const relativePath = yield getRelativePath(textDocument.uri);
        // The validator creates diagnostics for all uppercase words length 2 and more
        const text = textDocument.getText();
        const problems = 0;
        const diagnostics = [];
        const lexer = new lexer_1.default(relativePath || textDocument.uri, text);
        let i = 0;
        while (i < 400) {
            i++;
            const token = lexer.getNextToken();
            if (token === null) {
                break;
            }
            if (token.type === token_1.TokenType.UNKNOWN) {
                connection.console.log(`token: ${token_1.TokenType[token.type]}, lexeme: ${token.lexeme}, literal: ${token.literal}, location: ${token.mapping}`);
            }
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
