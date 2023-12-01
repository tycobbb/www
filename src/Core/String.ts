import { detect } from "https://deno.land/std@0.122.0/fs/mod.ts"
import { Fatal } from "../App/mod.ts";

// -- constants --
const k = {
  segmenter: new Intl.Segmenter(),
  variation: {
    unicode: String.fromCodePoint(0xFE0E)
  }
}

// -- queries --
// splits content into lines
export function lines(content: string): string[] {
  const eol = detect(content)
  if (eol == null) {
    return []
  }

  return content.split(eol)
}

// segment the unicode string (gracefully handles emojis)
export function segments(str: string): string[] {
  return Array.from(k.segmenter.segment(str)).map((s) => s.segment)
}

// convert the emoji string to its unicode representation
export function unemoji(str: string): string {
  switch (str.length) {
    case 0:
      return str
    case 1:
    case 2:
      return str[0] + k.variation.unicode
    default:
      throw new Fatal(`can't unemoji ${str}`)
  }
}

// trims the string
export function trim(content: string): string {
  return content.trim()
}
