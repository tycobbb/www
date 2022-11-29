import { assert, assertEquals, assertLength, stubConfig, stubEvents } from "../../../Test/mod.ts"
import { Event } from "../../Event/mod.ts"
import { SyncFiles } from "./SyncFiles.ts"

// -- setup --
const { test } = Deno

// stub config
const cfg = stubConfig()
const evts = stubEvents({ isLive: true })

// build paths
const src = cfg.paths.src

// -- tests --
test("it warns when deleting a file that doesn't exist", async () => {
  const sync = new SyncFiles(cfg, evts)
  sync.start()

  await evts.send(Event.deleteFile(src.join("test.file")))
  assertLength(evts.all, 2)

  const evt = evts.all[1]
  assert(evt.name === "show-warning")
  assertEquals(evt.msg, "tried to delete file that did not exist 'test/fixtures/test.file'")
})