"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("./token");
class Lexer {
    constructor(name, input) {
        this.characters = new Map([
            ['(', token_1.TokenType.LEFT_PAREN],
            [')', token_1.TokenType.RIGHT_PAREN],
            ['{', token_1.TokenType.LEFT_BRACE],
            ['}', token_1.TokenType.RIGHT_BRACE],
            ['[', token_1.TokenType.LEFT_BRACKET],
            [']', token_1.TokenType.RIGHT_BRACKET],
            [':', token_1.TokenType.COLON],
            [',', token_1.TokenType.COMMA],
            ['.', token_1.TokenType.DOT],
            ['-', token_1.TokenType.MINUS],
            ['+', token_1.TokenType.PLUS],
            ['/', token_1.TokenType.SLASH],
            ['*', token_1.TokenType.STAR]
        ]);
        this.keywords = new Set([
            'equ', 'dataseg', 'codeseg', 'db', 'dw', 'dd', 'dq',
            'dt', 'dup', 'proc', 'endp',
            'mov', 'add', 'sub', 'mul', 'div', 'inc', 'dec',
            'jmp', 'call', 'ret', 'push', 'pop', 'cmp', 'test',
            'je', 'jne', 'jg', 'jl', 'jge', 'jle',
            'and', 'or', 'xor', 'not', 'shl', 'shr',
            'clc', 'stc', 'cli', 'sti', 'hlt', 'nop',
        ]);
        this.mapping = new token_1.Mapping(name, 1, 1);
        this.input = input;
        this.position = 0;
        this.currentChar = this.input.length > 0 ? this.input[this.position] : null;
    }
    advance() {
        this.position++;
        this.mapping.column++;
        if (this.position >= this.input.length) {
            this.currentChar = null;
        }
        else {
            this.currentChar = this.input[this.position];
            while (this.currentChar === '\r') {
                this.mapping.line++;
                this.mapping.column = 0;
                this.position++;
                this.currentChar = this.input[this.position];
            }
        }
        return this.currentChar;
    }
    skipWhitespace() {
        while (this.currentChar !== null && /\s/.test(this.currentChar)) {
            this.advance();
        }
    }
    getNextToken() {
        while (this.currentChar !== null) {
            if (/\s/.test(this.currentChar)) {
                this.skipWhitespace();
                continue;
            }
            const location = this.mapping.copy();
            // Handle comments
            if (this.currentChar === ';') {
                let char = this.currentChar;
                while (char !== null && char !== '\n') {
                    char = this.advance();
                }
                continue;
            }
            if (this.currentChar === '"') {
                let str = '';
                this.advance(); // Skip the opening quote
                while (this.currentChar !== null && this.currentChar !== '"') {
                    str += this.currentChar;
                    this.advance();
                }
                this.advance(); // Skip the closing quote
                return new token_1.Token(token_1.TokenType.STRING, str, str, location);
            }
            if (this.currentChar === '\'') {
                let char = '';
                this.advance(); // Skip the opening quote
                while (this.currentChar !== null && this.currentChar !== '\'') {
                    char += this.currentChar;
                    this.advance();
                }
                this.advance(); // Skip the closing quote
                return new token_1.Token(token_1.TokenType.STRING, char, char, location);
            }
            if (this.characters.has(this.currentChar)) {
                const tokenType = this.characters.get(this.currentChar);
                this.advance();
                return new token_1.Token(tokenType, this.currentChar, null, location);
            }
            if (/\d/.test(this.currentChar)) {
                let numStr = '';
                while (this.currentChar !== null && /\d/.test(this.currentChar)) {
                    numStr += this.currentChar;
                    this.advance();
                }
                return new token_1.Token(token_1.TokenType.NUMBER, numStr, parseInt(numStr), location);
            }
            if (/[a-zA-Z_@]/.test(this.currentChar)) {
                let idStr = '';
                while (this.currentChar !== null && /[a-zA-Z0-9_@]/.test(this.currentChar)) {
                    idStr += this.currentChar;
                    this.advance();
                }
                if (this.keywords.has(idStr.toLowerCase())) {
                    return new token_1.Token(token_1.TokenType.KEYWORD, idStr, null, location);
                }
                else {
                    return new token_1.Token(token_1.TokenType.IDENTIFIER, idStr, idStr, location);
                }
            }
            const unexpectedChar = this.currentChar;
            this.advance();
            return new token_1.Token(token_1.TokenType.UNKNOWN, unexpectedChar, `Unknown character: ${unexpectedChar}`, location);
        }
        return null; // End of input
    }
}
exports.default = Lexer;
