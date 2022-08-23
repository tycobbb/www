import { assertEquals } from "../../Test/mod.ts"
import { ParserResult } from "./Parser.ts"
import { literal, any, whitespace, map, pred, repeat, either, pair, left, right } from "./Parser.ts"

// -- setup --
const { test } = Deno

// -- helpers --
const letter = pred(any, (c) => c.match(/\w/) != null)

// -- tests --
test("it matches a literal", () => {
  const match = literal("test")
  assertEquals(match("test string"), ParserResult.empty(" string"))
  assertEquals(match("lest string"), ParserResult.error("lest string"))
})

test("it maps a value", () => {
  const match = map(letter, (c) => c.toUpperCase())
  assertEquals(match(":test "), ParserResult.error(":test "))
  assertEquals(match("te:st "), ParserResult.value("T", "e:st "))
})

test("it repeats anything", () => {
  const match = repeat(literal("<"))
  assertEquals(match("test"), ParserResult.value([], "test"))
  assertEquals(match("<<< <<<"), ParserResult.value([null, null, null], " <<<"))
})

test("it matches a pair", () => {
  const match = pair(literal("<"), letter)
  assertEquals(match("</>"), ParserResult.error("</>"))
  assertEquals(match("[w:frag />"), ParserResult.error("[w:frag />"))
  assertEquals(left(match)("<w:frag />"), ParserResult.value(null, ":frag />"))
  assertEquals(right(match)("<w:frag />"), ParserResult.value("w", ":frag />"))
})

test("it matches either of two options", () => {
  const match = either(literal("<"), literal(">"))
  assertEquals(match("w:>"), ParserResult.error("w:>"))
  assertEquals(match("</>"), ParserResult.value(null, "/>"))
  assertEquals(match(">:w"), ParserResult.value(null, ":w"))
})

test("it matches whitespace", () => {
  const match = map(repeat(whitespace(), 1), (cs) => cs.join(""))
  assertEquals(match("a b  \t"), ParserResult.error("a b  \t"))
  assertEquals(match(" \t\n a"), ParserResult.value(" \t\n ", "a"))
})