import * as path from 'path';
import {
  workspace,
  ExtensionContext
} from 'vscode';

import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
  console.log('CLIENT: TASM extension activating...');
  // The server is implemented in node
  const serverModule = context.asAbsolutePath(
    path.join('server', 'out', 'server.js')
  );

  // If the extension is launched in debug mode then the debug server options are used
  // Otherwise the run options are used
  const serverOptions: ServerOptions = {
    run: {
      module: serverModule,
      transport: TransportKind.stdio
    },
    debug: {
      module: serverModule,
      transport: TransportKind.stdio,
      options: {
        execArgv: ['--nolazy', '--inspect=6009']
      }
    }
  };

  // Options to control the language client
  const clientOptions: LanguageClientOptions = {
    // Register the server for plain text documents.
    // IMPORTANT: Replace 'plaintext' with the actual languageId for TASM
    // This languageId must match the 'language' contribution in your main package.json
    documentSelector: [{
      scheme: 'file',
      language: 'tasm' // <--- Replace 'tasm' with your actual languageId
    }],
    synchronize: {
      // Notify the server about file changes to '.clientrc files contained in the workspace
      fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
    }
  };

  // Create the language client and start the client.
  client = new LanguageClient(
    'tasmLanguageServer', // Unique ID for the language server
    'TASM Language Server', // Display name
    serverOptions,
    clientOptions
  );

  // Start the client. This will also launch the server
  client.start();
  console.log('CLIENT: LanguageClient started.');
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}
