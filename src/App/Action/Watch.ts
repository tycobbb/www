import { Path, switchTo } from "../../Core/mod.ts"
import { Config } from "../Config/mod.ts"
import { PageGraph } from "../Page/mod.ts"
import { FileEvents, FileEvent } from "../File/mod.ts"
import { Action } from "./Action.ts"

export class Watch implements Action {
  // -- module --
  static get = () => new Watch()

  // -- deps --
  #cfg: Config
  #pages: PageGraph
  #files: FileEvents

  // -- props --
  #evts: {[key:string]: ReturnType<typeof switchTo>} = {}

  // -- lifetime --
  constructor(
    cfg = Config.get(),
    pages = PageGraph.get(),
    files = FileEvents.get()
  ) {
    this.#cfg = cfg
    this.#pages = pages
    this.#files = files
  }

  // -- commands --
  async call() {
    const { src, cwd } = this.#cfg.paths

    // watch src dir
    const watch = Deno.watchFs(src.str)

    // for every fs event, debounce an event on the path. we often get multiple
    // modifies in quick succession and need to dedupe them.
    for await (const evt of watch) {
      for (const epath of evt.paths) {
        // skip ignored paths
        const path = cwd.resolve(epath)
        if (this.#cfg.isIgnored(path)) {
          continue
        }

        // debounce events for this path
        this.#debounce(path, async () => {
          switch(evt.kind) {
            case "create":
              console.log(`create ${path.relative}`)
              // TODO: check extension, need to recompile some files
              // await new CopyFile(path).call()
              break
            case "modify": {
              const stat = await path.stat()
              if (stat == null) {
                console.log(`delete ${path.relative}`)
                // await new RmFile(path).call()
              } else if (stat.isDirectory) {
                console.log(`modify dir ${path.relative}`)
                // await new CopyDir(path).call()
              } else {
                console.log(`modify file ${path.relative}`)
                // TODO: check extension, need to recompile some files
                // await new CopyFile(path).call()
              }

              break
            }
            case "remove":
              console.log(`remove ${path.relative}`)
              // await new RmFile(path).call()
              break
            default: break
          }
        })
      }
    }
  }

  // -- c/helpers
  #debounce(path: Path, action: () => void) {
    const key = path.relative

    // grab the switch for this path
    const onEvent = this.#evts[key] ||= switchTo(50)

    // set the new action
    onEvent(() => {
      delete this.#evts[key]
      action()
    })
  }
}
