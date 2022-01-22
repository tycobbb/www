import { Path, switchTo, log } from "../../Core/mod.ts"
import { Config } from "../Config/mod.ts"
import { FileRef } from "../File/mod.ts"
import { PageGraph } from "../Page/mod.ts"
import { Event, Events } from "../Event/mod.ts"
import { Action } from "./Action.ts"

// -- types --
type WatchEvent
  = { kind: "add", file: FileRef }
  | { kind: "delete", path: Path }

// -- impls --
// rebuild pages on fs change
export class Watch implements Action {
  // -- module --
  static get = () => new Watch()

  // -- deps --
  #cfg: Config
  #evts: Events
  #pages: PageGraph

  // -- props --
  #fsEvts: {[key:string]: ReturnType<typeof switchTo>} = {}

  // -- lifetime --
  constructor(
    cfg = Config.get(),
    evts = Events.get(),
    pages = PageGraph.get(),
  ) {
    this.#cfg = cfg
    this.#evts = evts
    this.#pages = pages
  }

  // -- commands --
  async call(): Promise<void> {
    const { src, cwd } = this.#cfg.paths

    // watch src dir
    const watch = Deno.watchFs(src.str)

    // for every fs event, debounce an event on the path. we often get multiple
    // modifies in quick succession and need to dedupe them.
    for await (const {kind: fsKind, paths: fsPaths} of watch) {
      for (const fsPath of fsPaths) {
        // skip ignored paths
        const path = cwd.resolve(fsPath)
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
            this.#pages.deletePath(evt.path)
            this.#evts.add(Event.deleteFile(evt.path))
            return
          }

          switch (evt.file.kind) {
          // if it's a dir, copy it
          case "dir":
            this.#evts.add(Event.copyDir(evt.file)); break;
          // if it's not a file managed by the graph, copy it
          case "file":
            this.#evts.add(Event.copyFile(evt.file)); break;
          // otherwise, add it to the graph
          default:
            this.#pages.addPathToFile(evt.file.path)
            await this.#pages.compile()
            break
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
          return { kind: "delete", path }
        }
        // if this is a directory, add that
        else if (stat.isDirectory) {
          return { kind: "add", file: new FileRef(path, "dir") }
        }
        // otherwise, add the file
        else {
          return { kind: "add", file: new FileRef(path) }
        }
      }
      case "remove":
        return { kind: "delete", path }
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
    const key = path.relative

    // grab the switch for this path
    const onEvent = this.#fsEvts[key] ||= switchTo(50)

    // set the new action
    onEvent(() => {
      delete this.#fsEvts[key]
      action()
    })
  }
}
