import { Path, switchTo } from "../../Core/mod.ts"
import { Config } from "../Config/mod.ts"
import { PageGraph } from "../Page/mod.ts"
import { Event, EventStream } from "../Event/mod.ts"
import { Action } from "./Action.ts"

// -- types --
type WatchEvent
  = { kind: "add", path: Path, isDirectory: boolean }
  | { kind: "delete", path: Path }

// -- impls --
export class Watch implements Action {
  // -- module --
  static get = () => new Watch()

  // -- deps --
  #cfg: Config
  #evts: EventStream
  #pages: PageGraph

  // -- props --
  #fsEvts: {[key:string]: ReturnType<typeof switchTo>} = {}

  // -- lifetime --
  constructor(
    cfg = Config.get(),
    evts = EventStream.get(),
    pages = PageGraph.get(),
  ) {
    this.#cfg = cfg
    this.#evts = evts
    this.#pages = pages
  }

  // -- commands --
  async call() {
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
          const evt = await this.#mapWatchEvent(fsKind, path)
          if (evt == null) {
            return
          }

          // if it's a delete, remove it from the graph and fs
          if (evt.kind === "delete") {
            this.#pages.deletePath(evt.path)
            this.#evts.add(Event.deleteFile(evt.path))
          }
          // otherwise, add it to the graph and recompile
          else {
            if (evt.isDirectory) {
              this.#pages.addPathToDir(evt.path)
            } else {
              this.#pages.addPathToFile(evt.path)
            }

            await this.#pages.compile()
          }
        })
      }
    }
  }


  // -- queries --
  // transform an fs event into a watch event
  async #mapWatchEvent(
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
        // otherwise, add the file based on its type
        else {
          return { kind: "add", path, isDirectory: stat.isDirectory }
        }
      }
      case "remove":
        return { kind: "delete", path }
      default:
        // TODO: recoverable errors
        // log.e(`unknown FsEvent: ${kind} -> ${path.str}`)
        return null
    }
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
