import { BasicTokenId, KeywordId, Mapping, Token, TokenId, Location, ParseRange, AsmCommandId } from './token';
import { Reporter } from './reporter'

class Lexer {
  readonly filename: string;
  private location: Location
  private input: string;
  private position: number;
  private reporter: Reporter;

  private characters: Map<string, BasicTokenId> = new Map([
    ['(', BasicTokenId.LEFT_PAREN],
    [')', BasicTokenId.RIGHT_PAREN],
    ['{', BasicTokenId.LEFT_BRACE],
    ['}', BasicTokenId.RIGHT_BRACE],
    ['[', BasicTokenId.LEFT_BRACKET],
    [']', BasicTokenId.RIGHT_BRACKET],
    [':', BasicTokenId.COLON],
    [',', BasicTokenId.COMMA],
    ['.', BasicTokenId.DOT],
    ['-', BasicTokenId.MINUS],
    ['+', BasicTokenId.PLUS],
    ['/', BasicTokenId.SLASH],
    ['*', BasicTokenId.STAR],
    ['@', BasicTokenId.AT],
  ]);

  private regexpList: Map<RegExp, TokenId> = new Map([
    [/[a-zA-Z_]\w*\b/y, BasicTokenId.IDENTIFIER],
    [/;.*/y, BasicTokenId.COMMENT],
    [/\d+\b/y, BasicTokenId.NUMBER],
    [/\d[\da-fA-F]*[hH]\b/y, BasicTokenId.NUMBER],
  ]);

  // private keywords = new Set<string>([
  //   'equ', 'dataseg', 'codeseg', 'db', 'dw', 'dd', 'dq',
  //   'dt', 'dup', 'proc', 'endp',
  //   'mov', 'add', 'sub', 'mul', 'div', 'inc', 'dec',
  //   'jmp', 'call', 'ret', 'push', 'pop', 'cmp', 'test',
  //   'je', 'jne', 'jg', 'jl', 'jge', 'jle',
  //   'and', 'or', 'xor', 'not', 'shl', 'shr',
  //   'clc', 'stc', 'cli', 'sti', 'hlt', 'nop',
  // ]);

  private wsRegex = /\s+/y;



  constructor(name: string, input: string, reporter: Reporter) {
    this.filename = name
    this.location = new Location(1, 1);
    this.input = input;
    this.position = 0;
    this.reporter = reporter
    // this.currentChar = this.input.length > 0 ? this.input[this.position] : null;
  }

  // private advance() {
  //   this.position++;
  //   this.mapping.column++;
  //   if (this.position >= this.input.length) {
  //     this.currentChar = null;
  //   } else {
  //     this.currentChar = this.input[this.position];
  //     while (this.currentChar === '\r') {
  //       this.mapping.line++;
  //       this.mapping.column = 0;
  //       this.position++;
  //       this.currentChar = this.input[this.position];
  //     }
  //   }
  //   return this.currentChar;
  // }

  // private skipWhitespace() {
  //   while (this.currentChar !== null && /\s/.test(this.currentChar)) {
  //     this.advance();
  //   }
  // }

  private advance(text: string) {
    this.position += text.length;
    const lines = text.split('\n')
    const last = lines[lines.length - 1]
    if (lines.length > 1) {
      this.location.column = last.length + 1;
    } else {
      this.location.column += text.length;
    }
    this.location.line += lines.length - 1;
  }

  private advanceTilEndOfLine() {
    while (this.position < this.input.length && this.input[this.position] !== '\n') {
      this.position++;
      this.location.column++;
    }
  }


  public tokenize(): Array<Token> {
    const tokens: Array<Token> = [];
    let token: Token | null;

    do {
      token = this.getNextToken();

      if (token.id !== BasicTokenId.UNKNOWN && token.id !== BasicTokenId.COMMENT) {
        tokens.push(token);
      }
    } while (token.id !== BasicTokenId.EOF);

    return tokens;
  }

  private findKeywordId(keyword: string): KeywordId | undefined {
    return KeywordId[keyword.toUpperCase() as keyof typeof KeywordId]
  }

  private parseString(): Token {
    const startLocation = this.location.copy()
    const character = this.input[this.position];
    this.advance(character);
    let length = 0;
    while (this.position + length < this.input.length && this.input[this.position + length] !== character
      && this.input[this.position + length] !== '\n') {
      length++;
    }
    const str = this.input.slice(this.position, this.position + length)
    this.advance(str);
    if (this.input[this.position] === character) {
      this.advance(character);
    } else {
      // error - no ending to the string 
      this.reporter.reportError("Unterminated string", new ParseRange(startLocation, this.location))
    }
    return new Token(BasicTokenId.STRING, str, this.createMapping(startLocation, this.location))
  }

  private createMapping(from: Location, to?: Location): Mapping {
    if (!to) {
      to = from.copy()
      to.column++
    }
    return new Mapping(this.filename, new ParseRange(from, to))
  }

  public getNextToken(): Token {
    this.wsRegex.lastIndex = this.position;
    const match = this.wsRegex.exec(this.input);
    if (match && match.index === this.position) {
      const newLinePos = match[0].indexOf('\n')
      const location = this.location.copy()
      this.advance(match[0]);
      if (newLinePos > 0) {
        location.column += newLinePos
        const token = new Token(BasicTokenId.NEWLINE, '\\n', this.createMapping(location));
        return token
      }
    }
    if (this.position >= this.input.length) {
      return new Token(BasicTokenId.EOF, '', this.createMapping(this.location));
    }

    const location = this.location.copy();
    const currentChar = this.input[this.position];

    if (currentChar === '"' || currentChar === '\'') {
      return this.parseString()
    }

    const characterTokenId = this.characters.get(currentChar);
    if (characterTokenId !== undefined) {
      this.advance(currentChar);
      return new Token(characterTokenId, currentChar, this.createMapping(location, this.location));
    }

    var longestMatch = ""
    var token: Token | null = null;

    for (const [regex, tokenId] of this.regexpList) {
      regex.lastIndex = this.position;
      const match = regex.exec(this.input);
      if (match && match.index === this.position) {
        const matchedText = match[0];
        if (matchedText.length > longestMatch.length) {
          longestMatch = matchedText;
          token = new Token(tokenId, matchedText, this.createMapping(location));
        }
      }
    }
    if (token === null) {
      this.reporter.reportError(`unrecognized input: '${this.input[this.position]}`, new ParseRange(this.location, this.location))
      const location = this.location.copy()
      this.advanceTilEndOfLine()
      return new Token(BasicTokenId.UNKNOWN, `"${this.input.slice(this.position, this.position + 10)}"`, this.createMapping(location, this.location));
    }
    this.advance(longestMatch);
    token.mapping.range.to = this.location.copy()

    if (token.id === BasicTokenId.IDENTIFIER) {
      const keywordId = this.findKeywordId(token.text);
      if (keywordId !== undefined) {
        return new Token(keywordId, token.text, token.mapping);
      }

      const asmId = AsmCommandId[token.text.toUpperCase() as keyof typeof AsmCommandId];
      if (asmId !== undefined) {
        return new Token(asmId, token.text, token.mapping);
      }
    }
    return token;
  }
}

export default Lexer;