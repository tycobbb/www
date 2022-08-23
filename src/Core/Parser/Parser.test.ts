import { assertEquals } from "../../Test/mod.ts"
import { ParserResult } from "./Parser.ts"
import { literal, identifier, map, repeat, pair, left, right } from "./Parser.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it matches a literal", () => {
  const match = literal("test")
  assertEquals(match("test string"), ParserResult.empty(" string"))
  assertEquals(match("lest string"), ParserResult.error("lest string"))
})

test("it matches an identifier", () => {
  assertEquals(identifier(":test "), ParserResult.error(":test "))
  assertEquals(identifier("test: "), ParserResult.error("test: "))
  assertEquals(identifier("te:st "), ParserResult.value("te:st", " "))
})

test("it maps a value", () => {
  const match = map(identifier, (id) => id.toUpperCase())
  assertEquals(match(":test "), ParserResult.error(":test "))
  assertEquals(match("te:st "), ParserResult.value("TE:ST", " "))
})

test("it repeats anything", () => {
  const match = repeat(literal("<"))
  assertEquals(match("test"), ParserResult.value([], "test"))
  assertEquals(match("<<< <<<"), ParserResult.value([null, null, null], " <<<"))
})

test("it matches a pair", () => {
  const match = pair(literal("<"), identifier)
  assertEquals(match("</>"), ParserResult.error("</>"))
  assertEquals(match("[w:frag />"), ParserResult.error("[w:frag />"))
  assertEquals(left(match)("<w:frag />"), ParserResult.value(null, " />"))
  assertEquals(right(match)("<w:frag />"), ParserResult.value("w:frag", " />"))
})