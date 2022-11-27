import { stubConfig, assertRejects } from "../../../Test/mod.ts"
import { EventBus } from "../../../Core/mod.ts"
import { Event } from "../../Event/mod.ts"
import { SyncFiles } from "./SyncFiles.ts"
import { Warning } from "../../Error/mod.ts"

// -- setup --
const { test } = Deno

// stub config
const cfg = stubConfig()
const evts = new EventBus<Event>()

// build paths
const src = cfg.paths.src

// -- tests --
test("warns when deleting a file that doesn't exist", () => {
  const sync = new SyncFiles(cfg, evts)
  sync.start()

  assertRejects(
    async () => await evts.send(Event.deleteFile(src.join("test.file"))),
    Warning
  )
})