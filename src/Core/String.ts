import { detect } from "https://deno.land/std@0.100.0/fs/mod.ts"
import { log } from "./Log.ts"

// -- queries --
// splits content into lines
export function lines(content: string): string[] {
  const eol = detect(content)
  if (eol == null) {
    log.d(`- could not detect newline for '${content}'`)
    return []
  }

  return content.split(eol)
}
