import { Args } from "https://deno.land/std@0.122.0/flags/mod.ts"
import { decodeJson } from "../../Core/Decode/DecodeJson.ts"
import { decodeTw } from "../../Core/Decode/DecodeTw.ts"
import { transient, log } from "../../Core/mod.ts"
import { Config } from "../Config/mod.ts"
import { SyncFiles } from "../File/mod.ts"
import { Pages } from "../Page/Pages.ts"
import { Action } from "./Action.ts"

// initializes the app state and boostraps long-running processes
export class Init implements Action {
  // -- module --
  static readonly get = transient((args: Args) => new Init(args))

  // -- deps --
  #pages: Pages

  // -- props --
  #args: Args

  // -- lifetime --
  constructor(
    args: Args,
    pages = Pages.get()
  ) {
    this.#args = args
    this.#pages = pages
  }

  // -- commands --
  async call(): Promise<void> {
    log.d("d [init] start")

    // decode config
    await Config.set(this.#args)

    // configure pages
    this.#pages.addDataType({ format: "json", decode: decodeJson })
    this.#pages.addDataType({ format: "tw", decode: decodeTw })

    // run persistent file sync process
    new SyncFiles().start()
  }

  // -- queries --
  get isProcess(): boolean {
    return false
  }
}
