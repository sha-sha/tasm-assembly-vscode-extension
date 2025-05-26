import { AstAssembly, AstCodeSegment, AstNode, AstProcedure } from "./ast";
import Lexer from "./lexer";
import { Parser } from "./parser";
import { Reporter } from "./reporter";


const isCodeSegment = (node: AstNode) => node instanceof AstCodeSegment
const isProcedure = (node: AstNode) => node instanceof AstProcedure
const isAssembly = (node: AstNode) => node instanceof AstAssembly

const isOpcode = (code: string) => (node: AstAssembly) => node.opcode.toLowerCase() === code.toLowerCase()

function flatten<T>(listOfLists: T[][]): T[] {
  return listOfLists.reduce((accumulator, currentList) => accumulator.concat(currentList), []);
}


function validateReturn(procedure: AstProcedure, reporter: Reporter) {
  const asmCommandList = procedure.children.filter(isAssembly)
  // get the last assembly code, and verify that it is a return
  if (asmCommandList.reverse().findIndex(isOpcode('ret')) !== 0) {
    reporter.reportError(`missing 'ret' at the end of the '${procedure.name}' procedure`, procedure.mapping.range)
  }
}

function validateMatchingPopAll(procedure: AstProcedure, reporter: Reporter) {
  const asmCommandList = procedure.children.filter(isAssembly)
  const pusha = asmCommandList.find(isOpcode('pusha'))
  const popa = asmCommandList.find(isOpcode('popa'))
  if (pusha && !popa) {
    reporter.reportError(`missing 'popa' at '${procedure.name}' procedure`, pusha.mapping.range)
  } else if (!pusha && popa) {
    reporter.reportError(`missing 'pusha' at '${procedure.name}' procedure`, popa.mapping.range)
  }
}

export function scanFile(name: string, content: string, reporter: Reporter) {
  const lexer = new Lexer(name, content, reporter)
  const parser = new Parser(lexer, reporter)
  const ast = parser.parse()

  if (ast != null) {
    const segments = ast.children.filter(isCodeSegment)
    const procedures = flatten(segments.map(segment => segment.children.filter(isProcedure)))
    procedures.forEach(procedure => {
      validateReturn(procedure, reporter)
      validateMatchingPopAll(procedure, reporter)
    })
  }




}