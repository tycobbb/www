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
  error(...messages: string[]) {
    this.#add(LogLevel.Error, messages)
  }

  info(...messages: string[]) {
    this.#add(LogLevel.Info, messages)
  }

  debug(...messages: string[]) {
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
