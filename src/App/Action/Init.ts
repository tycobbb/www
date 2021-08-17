import { Args } from "https://deno.land/std@0.105.0/flags/mod.ts"
import { Config } from "../Config/mod.ts"
import { SyncFiles } from "../File/mod.ts"
import { Action } from "./Action.ts"

// initializes the app state and boostraps long-running processes
export class Init implements Action {
  // -- module --
  static get = (args: Args) => new Init(args)

  // -- props --
  #args: Args

  // -- lifetime --
  constructor(args: Args) {
    this.#args = args
  }

  // -- commands --
  async call(): Promise<void> {
    // decode config
    await Config.set(this.#args)

    // run persistent file sync process
    new SyncFiles().start()
  }

  // -- queries --
  get isSerial(): boolean {
    return true
  }
}
