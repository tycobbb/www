import { DecodeConfig } from "./DecodeConfig.ts"
import { assertEquals } from "../../../Test/mod.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it builds to a custom dir with the long arg", async () => {
  const decode = new DecodeConfig({ _: ["."], dir: "test" })
  const cfg = await decode.call()
  assertEquals(cfg.paths.dst.str, "test")
})

test("it builds to a custom dir with the short arg", async () => {
  const decode = new DecodeConfig({ _: ["."], d: "test" })
  const cfg = await decode.call()
  assertEquals(cfg.paths.dst.str, "test")
})