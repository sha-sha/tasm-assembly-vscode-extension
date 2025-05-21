import { Mapping, Token, TokenType } from './token';

class Lexer {
  private mapping: Mapping;
  private input: string;
  private position: number;
  private currentChar: string | null;

  private characters: Map<string, TokenType> = new Map([
    ['(', TokenType.LEFT_PAREN],
    [')', TokenType.RIGHT_PAREN],
    ['{', TokenType.LEFT_BRACE],
    ['}', TokenType.RIGHT_BRACE],
    ['[', TokenType.LEFT_BRACKET],
    [']', TokenType.RIGHT_BRACKET],
    [':', TokenType.COLON],
    [',', TokenType.COMMA],
    ['.', TokenType.DOT],
    ['-', TokenType.MINUS],
    ['+', TokenType.PLUS],
    ['/', TokenType.SLASH],
    ['*', TokenType.STAR]
  ]);

  private keywords = new Set<string>([
    'equ', 'dataseg', 'codeseg', 'db', 'dw', 'dd', 'dq',
    'dt', 'dup', 'proc', 'endp',
    'mov', 'add', 'sub', 'mul', 'div', 'inc', 'dec',
    'jmp', 'call', 'ret', 'push', 'pop', 'cmp', 'test',
    'je', 'jne', 'jg', 'jl', 'jge', 'jle',
    'and', 'or', 'xor', 'not', 'shl', 'shr',
    'clc', 'stc', 'cli', 'sti', 'hlt', 'nop',
  ]);



  constructor(name: string, input: string) {
    this.mapping = new Mapping(name, 1, 1);
    this.input = input;
    this.position = 0;
    this.currentChar = this.input.length > 0 ? this.input[this.position] : null;
  }

  private advance() {
    this.position++;
    this.mapping.column++;
    if (this.position >= this.input.length) {
      this.currentChar = null;
    } else {
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

  private skipWhitespace() {
    while (this.currentChar !== null && /\s/.test(this.currentChar)) {
      this.advance();
    }
  }

  public getNextToken(): Token | null {
    while (this.currentChar !== null) {
      if (/\s/.test(this.currentChar)) {
        this.skipWhitespace();
        continue;
      }
      const location = this.mapping.copy();

      // Handle comments
      if (this.currentChar === ';') {
        let char: string | null = this.currentChar;
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
        return new Token(TokenType.STRING, str, str, location);
      }

      if (this.currentChar === '\'') {
        let char = '';
        this.advance(); // Skip the opening quote
        while (this.currentChar !== null && this.currentChar !== '\'') {
          char += this.currentChar;
          this.advance();
        }
        this.advance(); // Skip the closing quote
        return new Token(TokenType.STRING, char, char, location);
      }


      if (this.characters.has(this.currentChar)) {
        const tokenType = this.characters.get(this.currentChar);
        this.advance();
        return new Token(tokenType!, this.currentChar, null, location);
      }

      if (/\d/.test(this.currentChar)) {
        let numStr = '';
        while (this.currentChar !== null && /\d/.test(this.currentChar)) {
          numStr += this.currentChar;
          this.advance();
        }
        return new Token(TokenType.NUMBER, numStr, parseInt(numStr), location);
      }

      if (/[a-zA-Z_@]/.test(this.currentChar)) {
        let idStr = '';
        while (this.currentChar !== null && /[a-zA-Z0-9_@]/.test(this.currentChar)) {
          idStr += this.currentChar;
          this.advance();
        }
        if (this.keywords.has(idStr.toLowerCase())) {
          return new Token(TokenType.KEYWORD, idStr, null, location);
        } else {
          return new Token(TokenType.IDENTIFIER, idStr, idStr, location);
        }
      }

      const unexpectedChar = this.currentChar;
      this.advance();
      return new Token(TokenType.UNKNOWN, unexpectedChar, `Unknown character: ${unexpectedChar}`, location);
    }

    return null; // End of input
  }
}

export default Lexer;