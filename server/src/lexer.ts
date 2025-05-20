import { Token, TokenType } from './token';

class Lexer {
  private input: string;
  private position: number;
  private currentChar: string | null;

  private characters: Map<string, TokenType> = new Map([
    ['(', TokenType.LEFT_PAREN],
    [')', TokenType.RIGHT_PAREN],
    ['{', TokenType.LEFT_BRACE],
    ['}', TokenType.RIGHT_BRACE],
    [',', TokenType.COMMA],
    ['.', TokenType.DOT],
    ['-', TokenType.MINUS],
    ['+', TokenType.PLUS],
    [';', TokenType.SEMICOLON],
    ['/', TokenType.SLASH],
    ['*', TokenType.STAR]
  ]);


  constructor(input: string) {
    this.input = input;
    this.position = 0;
    this.currentChar = this.input.length > 0 ? this.input[this.position] : null;
  }

  private advance() {
    this.position++;
    if (this.position >= this.input.length) {
      this.currentChar = null;
    } else {
      this.currentChar = this.input[this.position];
    }
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

      if (this.characters.has(this.currentChar)) {
        const tokenType = this.characters.get(this.currentChar);
        this.advance();
        return new Token(tokenType!, this.currentChar, null, this.position);
      }

      if (/\d/.test(this.currentChar)) {
        let numStr = '';
        while (this.currentChar !== null && /\d/.test(this.currentChar)) {
          numStr += this.currentChar;
          this.advance();
        }
        return new Token(TokenType.NUMBER, numStr, parseInt(numStr), this.position);
      }

      if (/[a-zA-Z_]/.test(this.currentChar)) {
        let idStr = '';
        while (this.currentChar !== null && /[a-zA-Z0-9_]/.test(this.currentChar)) {
          idStr += this.currentChar;
          this.advance();
        }
        return new Token(TokenType.IDENTIFIER, idStr, idStr, this.position);
      }

      return new Token(TokenType.UNKNOWN, this.currentChar, `Unknown character: ${this.currentChar}`, this.position);
    }

    return null; // End of input
  }
}

export default Lexer;