import { Cli } from "./Cli/mod.ts"
import { Action, Init, Clean, Scan, Build, Watch } from "./App/mod.ts"

// -- main --
async function Main(): Promise<void> {
  // build cli
  const cli = Cli.parse(Deno.args)

  // show usage if necessary
  if (cli.isHelp) {
    cli.usage()
  }

  // init the app state
  Init.get(cli.args).call()

  // build list of actions
  const actions: Action[] = [
    Clean.get(),
    Scan.get(),
    Build.get(),
  ]

  // add server actions if bringing it up
  if (cli.isServerUp) {
    actions.push(
      Watch.get()
    )
  }

  // run actions sequentially
  for (const action of actions) {
    await action.call()
  }
}

// -- bootstrap --
Main()
