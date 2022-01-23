import { transient } from "./Scope.ts"

// -- types --
export enum LogLevel {
  Error = 0,
  Info = 1,
  Debug = 2,
}

// -- impls --
export class Log {
  // -- module --
  static readonly get = transient(() => this.shared)

  // -- props --
  #level: LogLevel
  #count: number

  // -- lifetime --
  constructor(level: LogLevel) {
    this.#count = 0
    this.#level = level
  }

  // -- commands --
  // logs a message and returns the id of this log
  add(level: LogLevel, msg: string): number | null {
    // ignore message below the log level
    if (level > this.#level) {
      return null
    }

    // print the message
    console.log(msg)

    // return the next id
    this.#count += 1
    return this.#count
  }

  // -- queries --
  // gets the current log id
  get curr(): number  {
    return this.#count
  }

  // -- shared --
  // a mutable shared instance; generally don't want to do things like this
  static shared: Log

  // set the shared log
  static set(level: LogLevel) {
    this.shared = new Log(level)
  }
}

// -- module --
export const log = {
  // -- commands --
  // logs an error message
  e(msg: string): number | null {
    return Log.get().add(LogLevel.Error, msg)
  },

  // logs an info message
  i(msg: string): number | null {
    return Log.get().add(LogLevel.Info, msg)
  },

  // logs an debug message
  d(msg: string): number | null {
    return Log.get().add(LogLevel.Debug, msg)
  },

  // -- queries --
  // gets the current log id
  get curr(): number  {
    return Log.get().curr
  }
}
