// -- types --
export enum LogLevel {
  Error = 0,
  Info = 1,
  Debug = 2,
}

// -- impls --
export class Log {
  // -- module --
  static get = () => this.shared

  // -- props --
  #level: LogLevel

  // -- lifetime --
  constructor(level: LogLevel) {
    this.#level = level
  }

  // -- c/helpers
  add(level: LogLevel, messages: string[]) {
    if (level <= this.#level) {
      console.log(...messages)
    }
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
  e(...messages: string[]) {
    Log.get().add(LogLevel.Error, messages)
  },

  i(...messages: string[]) {
    Log.get().add(LogLevel.Info, messages)
  },

  d(...messages: string[]) {
    Log.get().add(LogLevel.Debug, messages)
  },
}
