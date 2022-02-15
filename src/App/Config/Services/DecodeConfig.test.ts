import { DecodeConfig } from "./DecodeConfig.ts"
import { assertEquals } from "../../../Test/mod.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("DecodeConfig ~ it outputs a custom directory", async () => {
  const decode = new DecodeConfig({ _: ["."], d: "test" })
  const cfg = await decode.call()
  assertEquals(cfg.paths.dst.str, "test")
})

test("DecodeConfig ~ it outputs a custom directory", async () => {
  const decode = new DecodeConfig({ _: ["."], dir: "test" })
  const cfg = await decode.call()
  assertEquals(cfg.paths.dst.str, "test")
})