// -- types --
enum LogLevel {
  Error = 0,
  Info = 1,
  Debug = 2,
}

// -- impls --
export class Log {
  // -- props --
  #level: LogLevel

  // -- lifetime --
  constructor(level: LogLevel = LogLevel.Debug) {
    this.#level = level
  }

  // -- commands --
  e(...messages: string[]) {
    this.#add(LogLevel.Error, messages)
  }

  i(...messages: string[]) {
    this.#add(LogLevel.Info, messages)
  }

  d(...messages: string[]) {
    this.#add(LogLevel.Debug, messages)
  }

  // -- c/helpers
  #add(level: LogLevel, messages: string[]) {
    if (level <= this.#level) {
      console.log(...messages)
    }
  }
}

// -- module --
export const log: Log = new Log()
