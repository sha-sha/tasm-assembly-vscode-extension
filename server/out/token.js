"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Mapping = exports.TokenType = exports.Token = void 0;
var TokenType;
(function (TokenType) {
    // Single-character tokens
    TokenType[TokenType["LEFT_PAREN"] = 0] = "LEFT_PAREN";
    TokenType[TokenType["RIGHT_PAREN"] = 1] = "RIGHT_PAREN";
    TokenType[TokenType["LEFT_BRACE"] = 2] = "LEFT_BRACE";
    TokenType[TokenType["RIGHT_BRACE"] = 3] = "RIGHT_BRACE";
    TokenType[TokenType["LEFT_BRACKET"] = 4] = "LEFT_BRACKET";
    TokenType[TokenType["RIGHT_BRACKET"] = 5] = "RIGHT_BRACKET";
    TokenType[TokenType["COLON"] = 6] = "COLON";
    TokenType[TokenType["COMMA"] = 7] = "COMMA";
    TokenType[TokenType["DOT"] = 8] = "DOT";
    TokenType[TokenType["MINUS"] = 9] = "MINUS";
    TokenType[TokenType["PLUS"] = 10] = "PLUS";
    TokenType[TokenType["SEMICOLON"] = 11] = "SEMICOLON";
    TokenType[TokenType["SLASH"] = 12] = "SLASH";
    TokenType[TokenType["STAR"] = 13] = "STAR";
    // One or two character tokens.
    TokenType[TokenType["BANG"] = 14] = "BANG";
    TokenType[TokenType["BANG_EQUAL"] = 15] = "BANG_EQUAL";
    TokenType[TokenType["EQUAL"] = 16] = "EQUAL";
    TokenType[TokenType["EQUAL_EQUAL"] = 17] = "EQUAL_EQUAL";
    TokenType[TokenType["GREATER"] = 18] = "GREATER";
    TokenType[TokenType["GREATER_EQUAL"] = 19] = "GREATER_EQUAL";
    TokenType[TokenType["LESS"] = 20] = "LESS";
    TokenType[TokenType["LESS_EQUAL"] = 21] = "LESS_EQUAL";
    // Literals.
    TokenType[TokenType["IDENTIFIER"] = 22] = "IDENTIFIER";
    TokenType[TokenType["STRING"] = 23] = "STRING";
    TokenType[TokenType["NUMBER"] = 24] = "NUMBER";
    TokenType[TokenType["KEYWORD"] = 25] = "KEYWORD";
    TokenType[TokenType["UNKNOWN"] = 26] = "UNKNOWN";
    TokenType[TokenType["EOF"] = 27] = "EOF";
})(TokenType || (exports.TokenType = TokenType = {}));
class Mapping {
    constructor(name, line, column) {
        this.name = name;
        this.line = line;
        this.column = column;
    }
    copy() {
        return new Mapping(this.name, this.line, this.column);
    }
    toString() {
        return `file://${this.name}:${this.line}:${this.column}`;
    }
}
exports.Mapping = Mapping;
class Token {
    constructor(type, lexeme, literal, mapping) {
        this.type = type;
        this.lexeme = lexeme;
        this.literal = literal;
        this.mapping = mapping;
    }
}
exports.Token = Token;
