import { segments, unemoji } from "./String.ts"
import { assertEquals } from "../Test/mod.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it segments a unicode string", () => {
  const actual = segments("✔️😤")
  assertEquals(actual, ["✔️", "😤"])
})

test("it converts the emoji string to its unicode variation", () => {
  const heart = String.fromCodePoint(0x2764) // ❤️
  const emoji = heart + String.fromCodePoint(0xFE0F)

  const expected = heart + String.fromCodePoint(0xFE0E)
  assertEquals(unemoji("❤️"), expected)
  assertEquals(unemoji(emoji), expected)
  assertEquals(unemoji(heart), expected)
})

