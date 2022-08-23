// import { assertEquals } from "../../Test/mod.ts"
// import { ParserResult, whitespace } from "./Parser.ts"
// import { identifier, map, repeat, either, pair, left, right } from "./Parser.ts"

// -- setup --
// const { test } = Deno

// -- tests --
// test("it matches an identifier", () => {
//   assertEquals(identifier(":test "), ParserResult.error(":test "))
//   assertEquals(identifier("test: "), ParserResult.error("test: "))
//   assertEquals(identifier("te:st "), ParserResult.value("te:st", " "))
// })