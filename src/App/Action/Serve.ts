import { posix } from "https://deno.land/std@0.105.0/path/mod.ts"
import { listenAndServe, ServerRequest, Response } from "https://deno.land/std@0.105.0/http/mod.ts"
import { serveFile } from "https://deno.land/std@0.105.0/http/file_server.ts"
import { Config } from "../Config/mod.ts"
import { Event, Events, EventStream } from "../Event/mod.ts"
import { Action } from "./Action.ts"

// start a static file server
export class Serve implements Action {
  // -- module --
  static get = () => new Serve()

  // -- deps --
  #cfg: Config
  #evts: Events

  // -- props --
  #encoder = new TextEncoder()

  // -- lifetime --
  constructor(
    cfg = Config.get(),
    evts: Events = EventStream.get()
  ) {
    this.#cfg = cfg
    this.#evts = evts
  }

  // -- commands --
  call(): Promise<void> {
    const port = 8888
    const host = "0.0.0.0"
    const addr = `${host}:${port}`

    listenAndServe(addr, this.#serve)
    this.#evts.add(Event.info(`listening on ${addr}`))

    return Promise.resolve()
  }

  // -- events --
  #serve = async (req: ServerRequest) => {
    let res: Response | null = null

    try {
      const normalized = this.#normalizeUrl(req.url)

      const stat = await Deno.stat(normalized)
      if (stat.isDirectory) {
        throw new Deno.errors.NotFound()
      }

      res = await serveFile(req, normalized)
    } catch (e) {
      res = await this.#serveFallback(req, e)
    } finally {
      try {
        res && await req.respond(res)
      } catch (e) {
        this.#evts.add(Event.warning(e.message))
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
  #normalizeUrl(url: string): string {
    let normalized = url

    // attempt to decode a uri
    try {
      normalized = decodeURI(normalized)
    } catch (e) {
      if (!(e instanceof URIError)) {
        throw e
      }
    }

    // and then grab the pathname
    try {
      const absolute = new URL(normalized)
      normalized = absolute.pathname
    } catch (e) {
      if (!(e instanceof TypeError)) {
        throw e
      }
    }

    // make sure we have an absolute path
    if (normalized[0] !== "/") {
      throw new URIError("The request URI is malformed.")
    }

    // normalize the path
    normalized = posix.normalize(normalized)

    // strip the query
    const query = normalized.indexOf("?")
    if (query > -1) {
      normalized = normalized.slice(0, query)
    }

    // resolve the root to an index page
    if (normalized === "/") {
      normalized += "index.html"
    }

    // try an html extension for anything missing one
    if (posix.extname(normalized) === "") {
      normalized += ".html"
    }

    // and append the path to the dst dir
    return posix.join(this.#cfg.paths.dst.str, normalized)
  }

  get isSerial(): boolean {
    return false
  }
}
