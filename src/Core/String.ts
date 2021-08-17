import { detect } from "https://deno.land/std@0.100.0/fs/mod.ts"

// -- queries --
// splits content into lines
export function lines(content: string): string[] {
  const eol = detect(content)
  if (eol == null) {
    return []
  }

  return content.split(eol)
}
