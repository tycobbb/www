import { serve, Status, STATUS_TEXT } from "https://deno.land/std@0.122.0/http/mod.ts"
import { serveFile } from "https://deno.land/std@0.122.0/http/file_server.ts"
import { transient } from "../../Core/Scope.ts"
import { log } from "../../Core/mod.ts"
import { Config } from "../Config/mod.ts"
import { FileUrl } from "../File/mod.ts"
import { Fatal } from "../Error/mod.ts"
import { Action } from "./Action.ts"
import { magenta } from "https://deno.land/std@0.122.0/fmt/colors.ts"

// -- constants --
// text to display if status text is missing (should not happen)
const kUnknownStatus = "No Description"

// -- impls --
// start a static file server
export class Serve implements Action {
  // -- module --
  static readonly get = transient(() => new Serve())

  // -- deps --
  // the config
  #cfg: Config

  // -- props --
  // a text encoder for error repsonses
  #encoder = new TextEncoder()

  // -- lifetime --
  // creata a new serve action
  constructor(
    cfg = Config.get(),
  ) {
    this.#cfg = cfg
  }

  // -- commands --
  call(): Promise<void> {
    const m = this

    // start the server
    const host = "0.0.0.0"
    const port = m.#cfg.port
    const proc = serve(m.#serveFile.bind(m), {
      hostname: host,
      port,
      onError: m.#serveError.bind(m)
    })

    // show cli output
    log.i(`✔ listening on ${host === "0.0.0.0" ? "localhost" : host}:${port}`)

    return proc
  }

  // -- events --
  // serve a single file
  async #serveFile(req: Request) {
    // get site directory
    const dst = this.#cfg.paths.dst

    // get a file url from the request
    const url = new FileUrl(req.url)

    // get possible paths from the url
    const paths = url.findPaths(dst.str)

    // find the first path that exists
    let path = null
    for (const p of paths) {
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

    // if we didn't find a path, throw a not found error
    if (path == null) {
      throw new Deno.errors.NotFound()
    }

    // otherwise serve the file
    const res = await serveFile(req, path)

    return res
  }

  // serve the fallback response in case of an error
  async #serveError(e: unknown): Promise<Response> {
    const m = this

    // find the status code for this error
    const code = m.#findStatusForError(e)
    const info = {
      status: code,
      statusText: STATUS_TEXT.get(code) || kUnknownStatus
    }

    // try to serve a file for this status code
    try {
      // find the file w/ a dummy request
      const file = `${info.status}.html`
      const req = new Request(`http://0.0.0.0:${m.#cfg.port}/${file}`)
      const path = m.#cfg.paths.dst.join(file)
      const res = await serveFile(req, path.str)

      // force the request to have the correct status
      return new Response(res.body, {
        ...info,
        headers: res.headers
      })
    }
    // otherwise, serve the status text directly
    catch (_: unknown) {
      return new Response(
        m.#encoder.encode(info.statusText),
        info
      )
    }
  }

  // -- queries --
  // find the status code for an error
  #findStatusForError(e: unknown): Status {
    if (e instanceof URIError) {
      return Status.BadRequest
    } else if (e instanceof Deno.errors.NotFound) {
      return Status.NotFound
    } else {
      return Status.InternalServerError
    }
  }

  // -- q/Action
  get isProcess(): boolean {
    return true
  }
}
