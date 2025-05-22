enum KeywordId {
  // keyword tokens
  IDEAL = "IDEAL",
  MODEL = "MODEL",
  SMALL = "SMALL",
  STACK = "STACK",
  JUMPS = "JUMPS",
  P186 = "P186",
  EQU = "EQU",
  DATASEG = "DATASEG",
  CODESEG = "CODESEG",
  DB = "DB",
  DW = "DW",
  DD = "DD",
  DQ = "DQ",
  DT = "DT",
  DUP = "DUP",
  PROC = "PROC",
  ENDP = "ENDP",
  MACRO = "MACRO",
  ENDM = "ENDM",
  INCLUDE = "INCLUDE",
  OFFSET = "OFFSET",
}

enum AsmCommandId {
  // Assembly instructions
  MOV = "MOV",
  ADD = "ADD",
  SUB = "SUB",
  MUL = "MUL",
  DIV = "DIV",
  INC = "INC",
  DEC = "DEC",
  JMP = "JMP",
  CALL = "CALL",
  RET = "RET",
  PUSH = "PUSH",
  POP = "POP",
  CMP = "CMP",
  TEST = "TEST",
  JE = "JE",
  JNE = "JNE",
  JG = "JG",
  JL = "JL",
  JGE = "JGE",
  JLE = "JLE",
  AND = "AND",
  OR = "OR",
  XOR = "XOR",
  NOT = "NOT",
  SHL = "SHL",
  SHR = "SHR",
  PUSHA = "PUSHA",
  POPA = "POPA",
}

enum BasicTokenId {
  // Single-character tokens
  LEFT_PAREN = "(",
  RIGHT_PAREN = ")",
  LEFT_BRACE = "{",
  RIGHT_BRACE = "}",
  LEFT_BRACKET = "[",
  RIGHT_BRACKET = "]",
  COLON = ":",
  COMMA = ",",
  DOT = ".",
  MINUS = "-",
  PLUS = "+",
  SEMICOLON = ";",
  SLASH = "/",
  STAR = "*",
  AT = "@",
  NEWLINE = "\\n",

  // Literals.
  IDENTIFIER = "IDENTIFIER",
  STRING = "STRING",
  NUMBER = "NUMBER",
  COMMENT = "COMMENT",
  UNKNOWN = "UNKNOWN",

  EOF = "EOF",

}


type TokenId = KeywordId | BasicTokenId | AsmCommandId;

class Location {
  line: number;
  column: number;
  constructor(line: number, column: number) {
    this.line = line;
    this.column = column;
  }
  copy(): Location {
    return new Location(this.line, this.column);
  }

  toString(): string {
    return `${this.line}:${this.column}`;
  }
}

class ParseRange {
  from: Location
  to: Location
  constructor(from: Location, to: Location) {
    this.from = from.copy();
    this.to = to.copy();
  }

  copy(): ParseRange {
    return new ParseRange(this.from.copy(), this.to.copy())
  }
}

class Mapping {
  name: string;
  range: ParseRange;

  constructor(name: string, range: ParseRange) {
    this.name = name;
    this.range = range;
  }

  copy(): Mapping {
    return new Mapping(this.name, this.range)
  }


  toString(): string {
    return `${this.name}:${this.range.from}`;
  }
}

class Token {
  id: TokenId;
  text: string;
  mapping: Mapping;

  constructor(id: TokenId, text: string, mapping: Mapping) {
    this.id = id;
    this.text = text;
    this.mapping = mapping;
  }

  toString(): string {
    return `Token(${this.id}, ${this.text}, ${this.mapping})`;
  }
}

export { Token, BasicTokenId, KeywordId, AsmCommandId, TokenId, Mapping, Location, ParseRange };