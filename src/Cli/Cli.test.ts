import { assertEquals } from "../Test/mod.ts"
import { Cli } from "./Cli.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it parses options", () => {
  const strs = ["-o", "output", "--verbose", "input", "-h"]
  const args = Cli.parse(strs).args

  assertEquals(args._, [
    "input"
  ])

  assertEquals(args.help, true)
  assertEquals(args.h, args.help)

  assertEquals(args.out, "output")
  assertEquals(args.o, args.out)

  assertEquals(args.prod, false)
  assertEquals(args.p, args.prod)

  assertEquals(args.up, false)
  assertEquals(args.u, args.up)

  assertEquals(args.verbose, true)
  assertEquals(args.v, args.verbose)
})
