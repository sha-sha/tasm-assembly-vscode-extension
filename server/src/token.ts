enum TokenType {
  // Single-character tokens
  LEFT_PAREN, RIGHT_PAREN,
  LEFT_BRACE, RIGHT_BRACE,
  LEFT_BRACKET, RIGHT_BRACKET,
  COLON,
  COMMA, DOT, MINUS, PLUS, SEMICOLON, SLASH, STAR,

  // One or two character tokens.
  BANG, BANG_EQUAL,
  EQUAL, EQUAL_EQUAL,
  GREATER, GREATER_EQUAL,
  LESS, LESS_EQUAL,

  // Literals.
  IDENTIFIER, STRING, NUMBER,

  KEYWORD,

  UNKNOWN,

  EOF

}

class Mapping {
  name: string;
  line: number;
  column: number;

  constructor(name: string, line: number, column: number) {
    this.name = name;
    this.line = line;
    this.column = column;
  }

  copy(): Mapping {
    return new Mapping(this.name, this.line, this.column);
  }

  toString(): string {
    return `file://${this.name}:${this.line}:${this.column}`;
  }
}

class Token {
  type: TokenType;
  lexeme: string;
  literal: string | number | null;
  mapping: Mapping;

  constructor(type: TokenType, lexeme: string, literal: any, mapping: Mapping) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.mapping = mapping;
  }
}

export { Token, TokenType, Mapping };