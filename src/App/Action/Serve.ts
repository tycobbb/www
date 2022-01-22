import { listenAndServe, ServerRequest, Response } from "https://deno.land/std@0.105.0/http/mod.ts"
import { serveFile } from "https://deno.land/std@0.105.0/http/file_server.ts"
import { log } from "../../Core/mod.ts"
import { Config } from "../Config/mod.ts"
import { FileUrl } from "../File/mod.ts"
import { Fatal } from "../Error/mod.ts"
import { Action } from "./Action.ts"

// start a static file server
export class Serve implements Action {
  // -- module --
  static get = () => new Serve()

  // -- deps --
  #cfg: Config

  // -- props --
  #encoder = new TextEncoder()

  // -- lifetime --
  constructor(
    cfg = Config.get(),
  ) {
    this.#cfg = cfg
  }

  // -- commands --
  call(): Promise<void> {
    const port = 8888
    const host = "0.0.0.0"
    const addr = `${host}:${port}`

    listenAndServe(addr, this.#serve)
    log.i(`✔ listening on ${addr}`)

    return Promise.resolve()
  }

  // -- events --
  #serve = async (req: ServerRequest) => {
    let res: Response | null = null

    try {
      const url = new FileUrl(req.url)

      // use the first path that exists
      let path = null
      for (const p of url.findPaths(this.#cfg.paths.dst.str)) {
        try {
          // check to see if the file exists, throws `NotFound` if it doesn't
          const stat = await Deno.stat(p)

          // this should not happen
          if (stat.isDirectory) {
            throw new Fatal("tried to serve a directory")
          }

          path = p
        } catch (e) {
          // if not found, continue, else rethrow
          if (!(e instanceof Deno.errors.NotFound)) {
            throw e
          }
        }
      }

      // if we didn't find a path, throw to show fallback
      if (path == null) {
        throw new Deno.errors.NotFound()
      }

      // otherwise serve the file
      res = await serveFile(req, path)
    } catch (e) {
      res = await this.#serveFallback(req, e)
    } finally {
      try {
        res && await req.respond(res)
      } catch (e) {
        log.e(e.message)
      }
    }
  }

  #serveFallback(_req: ServerRequest, e: Error): Promise<Response> {
    if (e instanceof URIError) {
      return Promise.resolve({
        status: 400,
        body: this.#encoder.encode("Bad Request"),
      });
    } else if (e instanceof Deno.errors.NotFound) {
      return Promise.resolve({
        status: 404,
        body: this.#encoder.encode("Not Found"),
      });
    } else {
      return Promise.resolve({
        status: 500,
        body: this.#encoder.encode("Internal server error"),
      });
    }
  }

  // -- queries --
  get isProcess(): boolean {
    return true
  }
}
