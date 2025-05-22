import { Location, Mapping } from "./token";

export enum AstId {
  Program,
  Config,
  Constant,
  CodeSegment,
  Label,

}

export class AstNode {
  id: AstId = AstId.Program;
  children: AstNode[] = [];
  mapping: Mapping;

  constructor(mapping: Mapping) {
    this.mapping = mapping.copy();
  }

  updateRange(to: Location): AstNode {
    this.mapping.range.to = to.copy()
    return this
  }

  pretty(indent: number = 0): string {
    const spaces = " ".repeat(indent)
    let result = "";
    result += this.prettySelf(indent) + "\n";
    for (const child of this.children) {
      result += child.pretty(indent + 2);
    }
    return result;
  }

  prettySelf(indent: number = 0): string {
    return " ".repeat(indent) + AstId[this.id].toString()
  }

}

export class AstRoot extends AstNode {
  id = AstId.Program;
}


export class AstCodeSegment extends AstNode {
  id = AstId.CodeSegment;
}

export class AstConfig extends AstNode {
  id = AstId.Config;
  ideal: Boolean = false
  model?: string
  stack?: Number
  jumps?: Boolean
  p186?: Boolean

  prettySelf(indent: number = 0): string {
    return " ".repeat(indent) + `Config(${this.ideal ? "ideal, " : ""} model: ${this.model ?? "N/A"}, stack: ${this.stack ?? "N/A"}, ${this.jumps ? "jumps, " : ""}${this.p186 ? "p186" : ""})`
  }
}

export class AstConstant extends AstNode {
  id = AstId.Constant;
  name: string
  value: number
  constructor(mapping: Mapping, name: string, value: number) {
    super(mapping)
    this.name = name
    this.value = value
  }

  prettySelf(indent: number = 0): string {
    return " ".repeat(indent) + `Constant(${this.name}=${this.value}/0${this.value.toString(16)}h)`
  }
}

export class AstLabel extends AstNode {
  id = AstId.Label;
  name: string
  constructor(mapping: Mapping, name: string) {
    super(mapping)
    this.name = name
  }

  prettySelf(indent: number = 0): string {
    return " ".repeat(indent) + `Label(${this.name})`
  }
}

export class AstTodo extends AstNode {
  text: string
  constructor(mapping: Mapping, text: string) {
    super(mapping)
    this.text = text
  }

  prettySelf(indent: number = 0): string {
    return " ".repeat(indent) + `TODO: ${this.text}`
  }
}

export class AstProcedure extends AstNode {
  name: string
  constructor(mapping: Mapping, name: string) {
    super(mapping)
    this.name = name
  }

  prettySelf(indent: number = 0): string {
    return " ".repeat(indent) + `PROC: ${this.name}`
  }
}

export class AstRegister extends AstNode {
  name: string
  constructor(mapping: Mapping, name: string) {
    super(mapping)
    this.name = name
  }
  prettySelf(indent: number = 0): string {
    return " ".repeat(indent) + `${this.name}`
  }
}

export class AstNumber extends AstNode {
  value: number
  constructor(mapping: Mapping, value: number) {
    super(mapping)
    this.value = value
  }
  prettySelf(indent: number = 0): string {
    return " ".repeat(indent) + `${this.value}`
  }
}

export class AstMemoryOffset extends AstNode {
  globalVariable: string
  constructor(mapping: Mapping, globalVariable: string) {
    super(mapping)
    this.globalVariable = globalVariable
  }
  prettySelf(indent: number = 0): string {
    return " ".repeat(indent) + `offset of ${this.globalVariable}`
  }
}

export class AstMemoryExpression extends AstNode {
  base: AstRegister | string
  offset?: AstRegister | number
  constructor(mapping: Mapping, base: AstRegister | string, offset?: AstRegister | number) {
    super(mapping)
    this.base = base
    this.offset = offset
  }
  prettySelf(indent: number = 0): string {
    return " ".repeat(indent) + `[${this.base}${(this.offset !== undefined) ? '+' + this.offset : ""}]`
  }
}

export type AstOperand = AstRegister | AstMemoryExpression | AstMemoryOffset | AstNumber | string

export class AstAssembly extends AstNode {
  opcode: string
  operand1?: AstOperand
  operand2?: AstOperand
  constructor(mapping: Mapping, opcode: string,
    operand1?: AstOperand,
    operand2?: AstOperand) {
    super(mapping)
    this.opcode = opcode
    this.operand1 = operand1
    this.operand2 = operand2
  }
  prettySelf(indent: number = 0): string {
    return " ".repeat(indent) + `${this.opcode}${this.operand1 ? ' ' + this.operand1 : ''}${this.operand2 ? ' ' + this.operand2 : ''}`
  }
}


// export { AstNode, AstConfig, AstId, AstRoot, AstConstant, AstTodo, AstCodeSegment, AstProcedure, AstLabel, AstAssembly };