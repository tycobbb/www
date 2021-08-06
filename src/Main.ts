import { Parse, Clean, Build } from "./App/mod.ts"

// -- main --
async function Main(): Promise<void> {
  // decode config
  const cfg = await new Parse(Deno.args).call()

  // build list of actions
  const actions = [
    new Clean(cfg),
    new Build(cfg)
  ]

  // run actions sequentially
  for (const action of actions) {
    await action.call()
  }
}

// -- bootstrap --
Main()
