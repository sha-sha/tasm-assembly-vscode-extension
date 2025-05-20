"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_1 = require("./token");
class Lexer {
    constructor(input) {
        this.characters = new Map([
            ['(', token_1.TokenType.LEFT_PAREN],
            [')', token_1.TokenType.RIGHT_PAREN],
            ['{', token_1.TokenType.LEFT_BRACE],
            ['}', token_1.TokenType.RIGHT_BRACE],
            [',', token_1.TokenType.COMMA],
            ['.', token_1.TokenType.DOT],
            ['-', token_1.TokenType.MINUS],
            ['+', token_1.TokenType.PLUS],
            [';', token_1.TokenType.SEMICOLON],
            ['/', token_1.TokenType.SLASH],
            ['*', token_1.TokenType.STAR]
        ]);
        this.input = input;
        this.position = 0;
        this.currentChar = this.input.length > 0 ? this.input[this.position] : null;
    }
    advance() {
        this.position++;
        if (this.position >= this.input.length) {
            this.currentChar = null;
        }
        else {
            this.currentChar = this.input[this.position];
        }
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
            if (this.characters.has(this.currentChar)) {
                const tokenType = this.characters.get(this.currentChar);
                this.advance();
                return new token_1.Token(tokenType, this.currentChar, null, this.position);
            }
            if (/\d/.test(this.currentChar)) {
                let numStr = '';
                while (this.currentChar !== null && /\d/.test(this.currentChar)) {
                    numStr += this.currentChar;
                    this.advance();
                }
                return new token_1.Token(token_1.TokenType.NUMBER, numStr, parseInt(numStr), this.position);
            }
            if (/[a-zA-Z_]/.test(this.currentChar)) {
                let idStr = '';
                while (this.currentChar !== null && /[a-zA-Z0-9_]/.test(this.currentChar)) {
                    idStr += this.currentChar;
                    this.advance();
                }
                return new token_1.Token(token_1.TokenType.IDENTIFIER, idStr, idStr, this.position);
            }
            return new token_1.Token(token_1.TokenType.UNKNOWN, this.currentChar, `Unknown character: ${this.currentChar}`, this.position);
        }
        return null; // End of input
    }
}
exports.default = Lexer;
