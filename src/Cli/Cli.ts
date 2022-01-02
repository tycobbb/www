import { Args, parse } from "https://deno.land/std@0.105.0/flags/mod.ts"
import { Path } from "../Core/mod.ts"
import { Log, LogLevel, log } from "../Core/mod.ts"
import { Events, EventStream, Fatal } from "../App/mod.ts"

// -- types --
type SaveMsg = {
  id: string,
  logId: number | null,
  count: number
}

// -- impls --
// interface to cli i/o
export class Cli {
  // -- deps --
  #evts: Events

  // -- props --
  #args: Args

  // a record of the last saved file msg
  #saveMsg: SaveMsg = {
    id: "",
    logId: null,
    count: 0
  }

  // -- lifetime --
  constructor(
    args: Args,
    evts: Events = EventStream.get(),
  ) {
    this.#evts = evts
    this.#args = args

    // set log level asap
    Log.set(this.isVerbose ? LogLevel.Debug : LogLevel.Info)
  }

  // -- commands --
  // prints the usage and exits
  usage(): void {
    log.i(this.#hdoc(`
      usage:
        www [options] <src>

      args:
        src  the path to the src directory

      options:
        -h, --help     prints this message
        -v, --verbose  prints more logs
        -u, --up       starts the file server
        -p, --prod     starts in production

      environment:
        PROD=1  starts in production
    `))

    Deno.exit(1)
  }

  // starts listening for output
  start(): void {
    this.#evts.on((e) => {
      switch (e.kind) {
      case "copy-dir":
        // falls through
      case "copy-file":
        this.#drawSavedFile("copy", e.file); break
      case "delete-file":
        log.i(`- delete: ${e.file.relative}`); break
      case "save-file":
        this.#drawSavedFile("build", e.file.path); break
      default: break
      }

      return Promise.resolve()
    })
  }

  catch(err: Error): void {
    // log and exit on fatal
    if (err instanceof Fatal) {
      log.e(this.#hdoc(`
        ✘ err: ${err.message}
        - run \`www --help\` for more info
      `))

      Deno.exit(2)
    }
    // log and exit on unknown errors
    else {
      log.e(this.#hdoc(`
        ! oops, unhandled error
        ---
        ${err.message}
      `))

      Deno.exit(3)
    }
  }

  // -- c/draw
  #drawSavedFile(action: string, path: Path): void {
    // the base log message
    let msg = `- ${action}: ${path.relative}`

    // check log record against this path
    const rec = this.#saveMsg
    const id = path.relative

    // if path matches prev line, then clear the prev line and log w/ count
    if (rec.id === id && rec.logId === log.curr) {
      rec.count += 1
      msg = `\u001b[1A\u001b[0K${msg} (${rec.count} times)`
    }
    // otherwise, reset the log record
    else {
      rec.id = id
      rec.count = 1
    }

    // log the message and update the log id
    rec.logId = log.i(msg)
  }

  // -- queries --
  // get the parsed args
  get args(): Args {
    return this.#args
  }

  // if the `h/help` flag is set
  get isHelp(): boolean {
    return this.#args.h || this.#args.help
  }

  // if the `v/verbose` flag is set
  get isVerbose(): boolean {
    return this.#args.v || this.args.verbose
  }

  // if the `u/up` flag is set
  get isServerUp(): boolean {
    return this.#args.u || this.#args.up
  }

  // draws a heredoc string; trims whitespace and leading padding
  #hdoc(str: string): string {
    // detect the leading padding
    let ns = 0
    for (const c of str) {
      if (c === "\n") {
        continue
      } else if (c === " ") {
        ns++
      } else {
        break
      }
    }

    // trim and remove leading padding
    const cleaned = str
      .split("\n")
      .map((l) => l.slice(ns))
      .join("\n")
      .trim()

    // draw the heredoc
    return cleaned
  }

  // -- factories --
  // build the cli from raw cmd line args
  static parse(args: string[]) {
    return new Cli(parse(args))
  }
}
