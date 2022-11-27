import { DecodeConfig } from "./DecodeConfig.ts"
import { assert, assertEquals, assertHas } from "../../../Test/mod.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it builds to a custom dir", async () => {
  const decode = new DecodeConfig({ _: ["./test/fixtures"], out: "test" })
  const cfg = await decode.call()
  assertEquals(cfg.paths.dst.str, "test")
})

test("it always ignores the dst dir", async () => {
  const decode = new DecodeConfig({ _: ["./test/fixtures"], out: "test" })
  const cfg = await decode.call()
  assertHas(cfg.ignored, "test")
})

test("it always ignores a standard set of paths", async () => {
  const decode = new DecodeConfig({ _: ["./test/fixtures"] })
  const cfg = await decode.call()
  assertHas(cfg.ignored, ".git")
  assertHas(cfg.ignored, ".gitignore")
  assertHas(cfg.ignored, ".wwwignore")
})