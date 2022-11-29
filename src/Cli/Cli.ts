import { Args, parse } from "https://deno.land/std@0.122.0/flags/mod.ts"
import { Path } from "../Core/mod.ts"
import { Log, LogLevel, log } from "../Core/mod.ts"
import { Event, Events, Fatal } from "../App/mod.ts"

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
    evts = Events.get(),
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
        -u, --up        runs as a dev server
        -x, --port <p>  the dev server port
        -p, --prod      runs production mode
        -o, --out <p>   sets the output path
        -v, --verbose   prints more logs
        -h, --help      prints this message

      environment:
        PROD=1  starts in production
    `))

    Deno.exit(1)
  }

  // starts listening for output
  start(): void {
    this.#evts.on((evt) => {
      switch (evt.name) {
      case "copy-dir":
        // falls through
      case "copy-file":
        this.#drawSavedFile("copy ", evt.file.path); break
      case "delete-file":
        log.i(`- delete: ${evt.file.rel}`); break
      case "save-file":
        this.#drawSavedFile("build", evt.file.path); break
      case "show-warning":
        this.#drawWarning(evt); break
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
      log.e(
        this.#hdoc(`
          ! oops, unhandled error
          ---
        `),
        err.stack || err.message
      )

      Deno.exit(3)
    }
  }

  // -- c/draw
  #drawSavedFile(action: string, path: Path): void {
    // the base log message
    let msg = `* ${action} - ${path.rel}`

    // check log record against this path
    const rec = this.#saveMsg
    const id = path.rel

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

  #drawWarning(evt: Extract<Event, { name: "show-warning" }>) {
    log.e(this.#hdoc(`
      ? warn: ${evt.msg}
      ↳ ${evt.cause}
    `))
  }

  // -- queries --
  // get the parsed args
  get args(): Args {
    return this.#args
  }

  // if the `h/help` flag is set
  get isHelp(): boolean {
    return this.#args.help
  }

  // if the `v/verbose` flag is set
  get isVerbose(): boolean {
    return this.#args.verbose
  }

  // if the `u/up` flag is set
  get isServerUp(): boolean {
    return this.#args.up
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
    return new Cli(parse(args, {
      alias: {
        "u": "up",
        "x": "port",
        "p": "prod",
        "o": "out",
        "v": "verbose",
        "h": "help",
      },
      boolean: [
        "help",
        "prod",
        "up",
        "verbose",
      ],
    }))
  }
}
