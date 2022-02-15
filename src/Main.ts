import { Cli } from "./Cli/mod.ts"
import { Action, Init, Clean, Scan, Build, Watch, Serve } from "./App/mod.ts"

// -- main --
async function Main(args: string[]): Promise<void> {
  // build cli
  const cli = Cli.parse(args)

  // show usage if flagged
  if (cli.isHelp) {
    cli.usage()
  }
  // otherwise start listening for events
  else {
    cli.start()
  }

  // run the app
  try {
    // init the app state
    await Init.get(cli.args).call()

    // build list of actions
    const actions: Action[] = [
      Clean.get(),
      Scan.get(),
      Build.get(),
    ]

    // add server actions if bringing it up
    if (cli.isServerUp) {
      actions.push(
        Watch.get(),
        Serve.get(),
      )
    }

    // run actions sequentially
    for (const action of actions) {
      const finished = action.call()

      // wait for anything that's not a process to finish
      if (!action.isProcess) {
        await finished
      }
    }
  }
  // let the cli handle any errors
  catch (err) {
    cli.catch(err)
  }
}

// -- bootstrap --
Main(Deno.args)
