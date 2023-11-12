import { assertParser } from "../../Test/mod.ts"
import { ParserResult } from "./Parser.ts"
import { any, pattern } from "./Parsers.ts"
import { sparse } from "./Sparse.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it matches sparse nodes", () => {
  const match = sparse(
    pattern(/^test/),
    any,
    (s) => s
  )

  const output = [
    "qjweq",
    "test",
    " s",
    "test",
    " erqw"
  ]

  assertParser(match("qjweqtest stest erqw"), ParserResult.value(output, ""))
})
