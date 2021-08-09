import { Config, Clean, Scan } from "./App/mod.ts"

// -- main --
async function Main(): Promise<void> {
  // decode config
  await Config.set(Deno.args)

  // build list of actions
  const actions = [
    Clean.get(),
    Scan.get(),
  ]

  // run actions sequentially
  for (const action of actions) {
    await action.call()
  }
}

// -- bootstrap --
Main()
