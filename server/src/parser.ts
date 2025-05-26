import { AstAssembly, AstCodeSegment, AstConfig, AstConstant, AstLabel, AstMemoryExpression, AstMemoryOffset, AstNode, AstNumber, AstOperand, AstProcedure, AstRegister, AstRoot, AstTodo } from "./ast";
import Lexer from "./lexer";
import { Reporter } from "./reporter";
import { AsmCommandId, BasicTokenId, KeywordId, Location, Mapping, ParseRange, Token, TokenId } from "./token";

const ConfigTokens = new Set<TokenId>([
  KeywordId.IDEAL,
  KeywordId.MODEL,
  KeywordId.SMALL,
  KeywordId.STACK,
  KeywordId.JUMPS,
  KeywordId.P186,
]);

const AsmRegisters = new Set([
  "ax", "al", "ah",
  "bx", "bl", "bh",
  "cx", "cl", "ch",
  "dx", "dl", "dh",
  "si", "di", "bp",
  "ds", "es", "ss",
])

function newMapping(from: Token, to: Token): Mapping {
  const res = from.mapping.copy()
  res.range.to = to.mapping.range.to
  return res
}


class Parser {
  private lexer: Lexer;
  private tokens: Array<Token> = [];
  private position = 0;
  private reporter: Reporter

  constructor(lexer: Lexer, reporter: Reporter) {
    this.lexer = lexer;
    this.reporter = reporter
  }

  public parse(): AstRoot | null {
    this.tokens = this.lexer.tokenize();
    this.position = 0;
    if (this.tokens.length === 0) {
      return null;
    }
    const ast = this.parseFile();
    return ast;
  }

  private parseFile(): AstRoot {
    const root = new AstRoot(new Mapping(this.lexer.filename, new ParseRange(new Location(1, 1), new Location(1, 1))));
    var token = this.peek();
    if (token.id === BasicTokenId.NEWLINE) {
      this.consume(BasicTokenId.NEWLINE)
      token = this.peek()
    }
    try {
      if (ConfigTokens.has(token.id)) {
        root.children.push(this.parseConfigHeader());
      }
      // Can be one of the following:
      // DATASEG, CODESEG, MACRO, INCLUDE, constants
      var i = 0
      while (token.id !== BasicTokenId.EOF && token.id !== BasicTokenId.UNKNOWN) {
        if (token.id === BasicTokenId.NEWLINE) {
          this.consume(BasicTokenId.NEWLINE)
        } else if (token.id === KeywordId.DATASEG) {
          root.children.push(this.parseDataSegment())
        } else if (token.id === KeywordId.CODESEG) {
          root.children.push(this.parseCodeSegment())
        } else if (token.id === KeywordId.MACRO) {
          root.children.push(this.parseMacro())
        } else if (token.id === KeywordId.INCLUDE) {
          root.children.push(this.parseInclude())
        } else if (token.id === BasicTokenId.IDENTIFIER) {
          const nextToken = this.peek(1)
          if (nextToken.id === KeywordId.EQU) {
            root.children.push(this.parseConstant())
          } else {
            this.reporter.reportError(`unexpected token '${nextToken.text}'`, nextToken.mapping.range)
            this.consumeTilNewLine()
          }
        }
        if (i++ > 100) break;
        token = this.peek();
      }
    } catch (error) {
    }
    return root
  }


  private parseConfigHeader(): AstNode {
    var token = this.peek();
    const config = new AstConfig(token.mapping)
    var i = 0
    do {
      if (token.id === KeywordId.IDEAL) {
        this.consume(KeywordId.IDEAL);
        this.consumeNewline();
        config.ideal = true;
      } else if (token.id === KeywordId.MODEL) {
        this.consume(KeywordId.MODEL);
        this.consume(KeywordId.SMALL);
        this.consumeNewline()
        config.model = "small";
      } else if (token.id === KeywordId.STACK) {
        this.consume(KeywordId.STACK);
        const amount = this.consume(BasicTokenId.NUMBER);
        this.consumeNewline()
        config.stack = this.parseNumber(amount);
      } else if (token.id === KeywordId.JUMPS) {
        this.consume(KeywordId.JUMPS);
        this.consumeNewline()
        config.jumps = true;
      } else if (token.id === KeywordId.P186) {
        this.consume(KeywordId.P186);
        this.consumeNewline()
        config.p186 = true;
      }
      token = this.peek();
      if (i++ > 100) break;
    } while (ConfigTokens.has(token.id))
    return config;
  }

  private parseDataSegment(): AstNode {
    const startToken = this.consume(KeywordId.DATASEG)
    this.consumeNewline()
    const node = new AstTodo(startToken.mapping, "parse data segment")
    var token = this.peek();
    while (token.id !== BasicTokenId.EOF && token.id !== BasicTokenId.UNKNOWN && token.id !== KeywordId.CODESEG) {
      this.consume(token.id)
      token = this.peek();
    }
    return node.updateRange(token.mapping.range.from)
  }

  private parseCodeSegment(): AstNode {
    const codeseg = this.consume(KeywordId.CODESEG)
    this.consumeNewline()
    const node = new AstCodeSegment(codeseg.mapping)
    var token = this.peek();
    // Can be one of the following:
    // MACRO, INCLUDE, constants, proc
    var i = 0
    while (token.id !== BasicTokenId.EOF && token.id !== BasicTokenId.UNKNOWN && token.id !== KeywordId.DATASEG && token.id !== KeywordId.CODESEG) {
      try {
        if (token.id === KeywordId.MACRO) {
          node.children.push(this.parseMacro())
        } else if (token.id === KeywordId.INCLUDE) {
          node.children.push(this.parseInclude())
        } else if (token.id === KeywordId.PROC) {
          node.children.push(this.parseProcedure())
        } else if (token.id === BasicTokenId.LOCAL_IDENTIFIER) {
          node.children.push(this.parseLabel())
        } else if (token.id === BasicTokenId.IDENTIFIER && this.peek(1).id === BasicTokenId.COLON) {
          node.children.push(this.parseLabel())
        } else {
          const nodes = this.parseCodeBlock()
          for (const n of nodes) {
            node.children.push(n)
          }
        }
      } catch (error) {
        this.consumeTilNewLine()
      }

      if (i++ > 400) {
        this.reporter.reportError(`Too many tokens in code segment. current token: ${token}`, newMapping(codeseg, token).range);
        break;
      };
      token = this.peek();
    }
    return node
  }

  private parseCodeBlock(): Array<AstNode> {
    const nodes: Array<AstNode> = []
    // Can be one of the following:
    // INCLUDE, constants, assembly, label
    var i = 0
    while (this.peek().id !== BasicTokenId.EOF) {
      const token = this.peek();
      const node: Array<AstNode> = []
      try {
        if (token.id === KeywordId.INCLUDE) {
          nodes.push(this.parseInclude())
        } else if (token.id === BasicTokenId.IDENTIFIER) {
          const nextToken = this.peek(1)
          if (nextToken.id === KeywordId.EQU) {
            nodes.push(this.parseConstant())
          } else if (nextToken.id === BasicTokenId.COLON) {
            nodes.push(this.parseLabel())
          } else {
            this.reporter.reportError(`unexpected token '${nextToken.text}'`, nextToken.mapping.range)
            this.consumeTilNewLine()
          }
        } else if (token.id === BasicTokenId.LOCAL_IDENTIFIER) {
          nodes.push(this.parseLabel())
        } else if (token.id in AsmCommandId) {
          const startToken = this.consume(token.id)
          const opcode = startToken.text
          let operand1: AstOperand | undefined
          let operand2: AstOperand | undefined
          if (this.peek().id !== BasicTokenId.NEWLINE) {
            operand1 = this.parseOperand()
            if (!operand1) {
              this.consumeTilNewLine()
              continue
            }
            if (this.peek().id === BasicTokenId.COMMA) {
              this.consume(BasicTokenId.COMMA)
              operand2 = this.parseOperand()
              if (!operand2) {
                this.consumeTilNewLine()
                continue
              }
            }
          }
          this.consumeNewline()
          nodes.push(new AstAssembly(newMapping(startToken, token), opcode, operand1, operand2))
        } else {
          break // end of code block, continue elsewhere
        }
      } catch (error) {
        this.consumeTilNewLine()
      }
    }

    return nodes
  }

  private parseOperand(): AstOperand | string | undefined {
    // operand: register / memory / immediate
    const token = this.peek()
    if (token.id === BasicTokenId.IDENTIFIER) {
      const name = this.consume(BasicTokenId.IDENTIFIER)
      if (AsmRegisters.has(name.text.toLowerCase())) {
        return new AstRegister(name.mapping, name.text)
      } else {
        return name.text
      }
    } else if (token.id === BasicTokenId.LOCAL_IDENTIFIER) {
      return this.consume(BasicTokenId.LOCAL_IDENTIFIER).text
    } else if (token.id === KeywordId.OFFSET) {
      const token = this.consume(KeywordId.OFFSET)
      const variable = this.consume(BasicTokenId.IDENTIFIER)
      return new AstMemoryOffset(newMapping(token, variable), variable.text)
    } else if (token.id === BasicTokenId.LEFT_BRACKET) {
      const start = this.consume(BasicTokenId.LEFT_BRACKET)
      var cast: 'byte' | 'word' | undefined
      if (this.peek().id == KeywordId.BYTE || this.peek().id === KeywordId.WORD) {
        const castToken = this.consume(this.peek().id)
        this.consume(KeywordId.PTR)
        cast = castToken.id === KeywordId.BYTE ? 'byte' : 'word'
      }
      const name = this.consume(BasicTokenId.IDENTIFIER)
      var base: AstRegister | string
      if ((AsmRegisters.has(name.text.toLowerCase()))) {
        // check for reg:reg like es:di
        if (this.peek().id === BasicTokenId.COLON) {
          this.consume(BasicTokenId.COLON)
          const otherReg = this.consume(BasicTokenId.IDENTIFIER)
          base = new AstRegister(name.mapping, otherReg.text, name.text)
        } else {
          base = new AstRegister(name.mapping, name.text)
        }
      } else {
        base = name.text
      }
      var offset: AstRegister | number | undefined
      if (this.peek().id === BasicTokenId.PLUS) {
        this.consume(BasicTokenId.PLUS)
        if (this.peek().id === BasicTokenId.NUMBER) {
          offset = this.parseNumber(this.consume(BasicTokenId.NUMBER))
        } else {
          const reg = this.consume(BasicTokenId.IDENTIFIER)
          if (AsmRegisters.has(reg.text.toLowerCase())) {
            offset = new AstRegister(reg.mapping, reg.text)
          } else {
            this.reporter.reportError('expected a register or a number', reg.mapping.range)
          }
        }
        const end = this.consume(BasicTokenId.RIGHT_BRACKET)
        return new AstMemoryExpression(newMapping(start, end), base, offset, cast)
      } else {
        const end = this.consume(BasicTokenId.RIGHT_BRACKET)
        return new AstMemoryExpression(newMapping(start, end), base, offset, cast)
      }
    } else if (token.id === BasicTokenId.NUMBER) {
      const number = this.consume(BasicTokenId.NUMBER)
      return new AstNumber(number.mapping, this.parseNumber(number))
    }
    this.reporter.reportError('expected valid operand', token.mapping.range)
  }


  private parseMacro(): AstNode {
    const startToken = this.consume(KeywordId.MACRO)
    const node = new AstTodo(startToken.mapping, "parse macro")
    var token = this.peek();
    while (token.id !== BasicTokenId.EOF && token.id !== BasicTokenId.UNKNOWN && token.id !== KeywordId.ENDM) {
      this.consume(token.id)
      token = this.peek();
    }
    const endToken = this.consume(KeywordId.ENDM)
    if (this.peek().id !== BasicTokenId.NEWLINE) {
      const name2 = this.consume(BasicTokenId.IDENTIFIER)
    }
    this.consumeNewline()
    return node.updateRange(endToken.mapping.range.to)
  }

  private parseInclude(): AstNode {
    const startToken = this.consume(KeywordId.INCLUDE)
    const name = this.consume(BasicTokenId.STRING)
    this.consumeNewline()
    const node = new AstTodo(newMapping(startToken, name), `parse include ${name.text}`)
    return node
  }

  private parseConstant(): AstNode {
    const tokenKey = this.consume(BasicTokenId.IDENTIFIER)
    this.consume(KeywordId.EQU)
    const tokenVal = this.consume(BasicTokenId.NUMBER)
    this.consumeNewline()
    return new AstConstant(tokenKey.mapping, tokenKey.text, this.parseNumber(tokenVal))
  }

  private parseLabel(): AstLabel {
    const first = this.consume(this.peek().id)
    const last = this.consume(BasicTokenId.COLON)
    this.consumeNewline() // Fix: label can exist before asm command
    return new AstLabel(newMapping(first, last), first.text)
  }

  private parseProcedure(): AstNode {
    const location = this.consume(KeywordId.PROC).mapping
    const name = this.consume(BasicTokenId.IDENTIFIER)
    this.consumeNewline()
    const node = new AstProcedure(location, name.text)
    const nodes = this.parseCodeBlock()
    for (const n of nodes) {
      node.children.push(n)
    }
    const last = this.consume(KeywordId.ENDP)
    node.mapping.range.to = last.mapping.range.to
    if (this.peek().id !== BasicTokenId.NEWLINE) {
      const name2 = this.consume(BasicTokenId.IDENTIFIER)
      if (name2.text !== name.text) {
        this.reporter.reportError(`Unmatched ENDP: '${name2.text}' should be '${name.text}'`, name2.mapping.range)
      }
    }
    this.consumeNewline()
    return node
  }

  private peek(skip: number = 0): Token {
    return this.tokens[this.position + skip];
  }

  private consumeNewline(): Token {
    if (this.peek().id === BasicTokenId.EOF) {
      this.reporter.reportInfo(`missing new-line at the end of the file`, this.peek().mapping.range)
      return this.peek()
    }
    const token = this.consume(BasicTokenId.NEWLINE)
    while (this.peek().id === BasicTokenId.NEWLINE) {
      this.consume(BasicTokenId.NEWLINE)
    }
    return token
  }

  private consumeTilNewLine() {
    var token = this.peek()
    while (token.id !== BasicTokenId.NEWLINE && token.id !== BasicTokenId.EOF) {
      this.consume(token.id)
      token = this.peek()
    }
    if (token.id === BasicTokenId.NEWLINE) {
      this.consumeNewline()
    }
  }

  private consume(id: TokenId): Token {
    const token = this.tokens[this.position];
    if (token === null) {
      const lastToken = this.tokens[this.position - 1]
      this.reporter.reportError("Unexpected end of file", new ParseRange(lastToken.mapping.range.to, lastToken.mapping.range.to))
      throw new Error("Unexpected end of file");
    }
    if (token.id === id) {
      this.position++;
      return token;
    }
    this.reporter.reportError(`Expected ${id} but found ${token.id} at ${token.mapping}`, token.mapping.range)
    throw new Error(`Expected ${id} but found ${token.id} at ${token.mapping}`);
  }

  private parseNumber(token: Token): number {
    if (token.id !== BasicTokenId.NUMBER) {
      throw new Error(`Expected number but found ${token.id} at ${token.mapping}`);
    }
    if (token.text.endsWith("h") || token.text.endsWith("H")) {
      const hexValue = token.text.slice(0, -1);
      const value = parseInt(hexValue, 16);
      if (isNaN(value)) {
        throw new Error(`Invalid hex number ${token.text} at ${token.mapping}`);
      }
      return value;
    }
    const value = parseInt(token.text, 10);
    if (isNaN(value)) {
      throw new Error(`Invalid number ${token.text} at ${token.mapping}`);
    }
    return value;
  }

}


export { Parser };