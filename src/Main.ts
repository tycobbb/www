import { Cli } from "./Cli/mod.ts"
import { Config, Clean, Scan, Build } from "./App/mod.ts"

// -- main --
async function Main(): Promise<void> {
  // build cli
  const cli = Cli.parse(Deno.args)

  // show usage if necessary
  if (cli.isHelp) {
    cli.usage()
  }

  // decode config
  await Config.set(cli.args)

  // build list of actions
  const actions = [
    Clean.get(),
    Scan.get(),
    Build.get(),
  ]

  // run actions sequentially
  for (const action of actions) {
    await action.call()
  }
}

// -- bootstrap --
Main()
