import { assertParser } from "../../Test/mod.ts"
import { ParserResult } from "./Parser.ts"
import {
  Aggregate,
  any,
  delimited,
  first,
  literal,
  map,
  pair,
  pattern,
  pred,
  repeatUntil,
  sequence,
} from "./Parsers.ts"

// -- setup --
const { test } = Deno

// -- helpers --
const letter = pred(any,
  (c) => c.match(/\w/) != null)

// -- tests --
test("it matches a literal", () => {
  const match = literal("test")
  assertParser(match("test string"), ParserResult.empty(" string"))
  assertParser(match("lest string"), ParserResult.fault("lest string"))
})

test("it matches a pattern", () => {
  const match = pattern(/(test1)./, 1)
  assertParser(match("test1 test2"), ParserResult.value("test1", "test2"))
})

test("it maps a value", () => {
  const match = map(
    letter,
    (c) => c.toUpperCase()
  )

  assertParser(match(":test "), ParserResult.fault(":test "))
  assertParser(match("te:st "), ParserResult.value("T", "e:st "))
})

test("it repeats a sequence", () => {
  const match = sequence(
    literal("<")
  )

  assertParser(match("test"), ParserResult.value([], "test"))
  assertParser(match("<<< <<<"), ParserResult.value([null, null, null], " <<<"))
})

test("it matches a delimited sequence", () => {
  const match = delimited(
    pattern(/^\w/),
    literal(",")
  )

  assertParser(match("a,b,c,d e"), ParserResult.value(["a", "b", "c", "d"], " e"))
})

test("it accumulates the parser up through a delimeter", () => {
  const match = repeatUntil(
    any,
    literal("!"),
    ...Aggregate.string
  )

  assertParser(match("any until !this"), ParserResult.value("any until ", "this"))
})

test("it matches a pair", () => {
  const match = pair(
    literal("<"),
    letter
  )

  assertParser(match("</>"), ParserResult.fault("</>"))
  assertParser(match("[w:frag />"), ParserResult.fault("[w:frag />"))
  assertParser(match("<w:frag />"), ParserResult.value([null, "w"], ":frag />"))
})

test("it matches the first of n options", () => {
  const match = first(
    literal("<"),
    literal(">")
  )

  assertParser(match("w:>"), ParserResult.fault("w:>"))
  assertParser(match("</>"), ParserResult.value(null, "/>"))
  assertParser(match(">:w"), ParserResult.value(null, ":w"))
})