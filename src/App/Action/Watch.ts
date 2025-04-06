import { Path, switchTo, log, transient } from "../../Core/mod.ts"
import { Config } from "../Config/mod.ts"
import { FileRef, FileKind } from "../File/mod.ts"
import { Pages } from "../Page/mod.ts"
import { Event, Events } from "../Event/mod.ts"
import { Action } from "./Action.ts"

// -- types --
type WatchEvent =
  | {
    kind: "add",
    file: FileRef
  }
  | {
    kind: "delete",
    file: FileRef
  }

// -- impls --
// rebuild pages on fs change
export class Watch implements Action {
  // -- module --
  static readonly get = transient(() => new Watch())

  // -- deps --
  // the app config
  #cfg: Config

  // a bus for app events
  #evts: Events

  // the page graph
  #pages: Pages

  // -- props --
  #fsEvts: {[key:string]: ReturnType<typeof switchTo>} = {}

  // -- lifetime --
  constructor(
    cfg = Config.get(),
    evts = Events.get(),
    pages = Pages.get(),
  ) {
    this.#cfg = cfg
    this.#evts = evts
    this.#pages = pages
  }

  // -- commands --
  async call(): Promise<void> {
    const { src } = this.#cfg.paths

    // watch src dir
    const watch = Deno.watchFs(src.str)

    // for every fs event, debounce an event on the path. we often get multiple
    // modifies in quick succession and need to dedupe them.
    for await (const {kind: fsKind, paths: fsPaths} of watch) {
      for (const fsPath of fsPaths) {
        // skip ignored paths
        const path = Path.resolve(fsPath, src)
        if (this.#cfg.isIgnored(path)) {
          continue
        }

        // debounce events for this path
        this.#debounce(path, async () => {
          // get the watch event
          const evt = await this.#initWatchEvent(fsKind, path)
          if (evt == null) {
            return
          }

          // if it's a delete, remove it from the graph and fs
          if (evt.kind === "delete") {
            switch (evt.file.kind.type) {
              // if it's a flat dir or file, delete it directly
              case "dir":
                // falls through
              case "file":
                this.#evts.send(Event.deleteFile(evt.file.path)); break
              // otherwise, remove it from the graph
              default:
                this.#pages.delete(evt.file)
            }
          }
          // otherwise, add this file
          else {
            switch (evt.file.kind.type) {
              // if it's a dir, copy it
              case "dir":
                this.#evts.send(Event.copyDir(evt.file)); break
              // if it's not a file managed by the graph, copy it
              case "file":
                this.#evts.send(Event.copyFile(evt.file)); break
              // otherwise, add it to the graph
              default:
                this.#pages.change(evt.file)
                await this.#pages.render()
            }
          }
        })
      }
    }
  }

  // -- queries --
  // transform an fs event into a watch event
  async #initWatchEvent(
    kind: Deno.FsEvent["kind"],
    path: Path
  ): Promise<WatchEvent | null> {
    switch(kind) {
      case "create":
        // falls through; treat create & modify the same
      case "modify": {
        const stat = await path.stat()

        // if file stat is missing, this is a delete (does happen)
        if (stat == null) {
          return { kind: "delete", file: FileRef.init(path) }
        }
        // if this is a directory, add that
        else if (stat.isDirectory) {
          return { kind: "add", file: FileRef.init(path, FileKind.flat("dir")) }
        }
        // otherwise, add the file
        else {
          return { kind: "add", file: FileRef.init(path) }
        }
      }
      case "remove":
        return { kind: "delete", file: FileRef.init(path) }
      default:
        log.e(`! unknown FsEvent: ${kind} -> ${path.str}`)
        return null
    }
  }

  get isProcess(): boolean {
    return true
  }

  // -- helpers --
  // debounce the action for the given path; should maybe be moved into core
  #debounce(path: Path, action: () => void) {
    const key = path.rel

    // grab the switch for this path
    const onEvent = this.#fsEvts[key] ||= switchTo(50)

    // set the new action
    onEvent(() => {
      delete this.#fsEvts[key]
      action()
    })
  }
}