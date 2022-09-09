import { assertParser } from "../../Test/mod.ts"
import { ParserResult } from "./Parsers.ts"
import { string } from "./Common.ts"
import {
  any,
  pattern,
} from "./Parsers.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it matches strings", () => {
  const match = string()

  const str1 = `"a double-quoted \\" string"`
  assertParser(match(str1), ParserResult.value(str1, ""))

  const str2 = `'a single-quoted \\' string'`
  assertParser(match(str2), ParserResult.value(str2, ""))

  const str3 = "`a backtick-quoted \\` string`"
  assertParser(match(str3), ParserResult.value(str3, ""))
})
