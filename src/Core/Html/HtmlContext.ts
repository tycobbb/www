// -- types --
// a parsing configuration
export type HtmlConfig = Readonly<{
  elements: ReadonlySet<string>
}>

// -- impls --
// the html parser's context & state
export class HtmlContext {
  // -- props --
  // the html config
  readonly cfg: HtmlConfig

  // the current stack of node names
  readonly #stack: string[] = []

  // -- lifetime --
  constructor(cfg: HtmlConfig) {
    this.cfg = cfg
  }

  // -- commands --
  // push a new name onto the top of the stack
  push(name: string) {
    this.#stack.push(name)
  }

  // remove the top name from the stack
  pop(): string {
    const name = this.#stack.pop()
    if (name == null) {
      throw new Error("[html] there were no names on the stack to pop")
    }

    return name
  }

  // -- queries --
  // the top name on the stack
  peek(): string {
    const name = this.#stack[this.#stack.length - 1]
    if (name == null) {
      throw new Error("[html] there were no names on the stack to peek")
    }

    return name
  }
}