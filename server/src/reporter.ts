import { ParseRange } from "./token";

interface Reporter {
  reportError(text: string, range: ParseRange): void
  reportInfo(text: string, range: ParseRange): void
  log(text: string): void
}

export { Reporter }