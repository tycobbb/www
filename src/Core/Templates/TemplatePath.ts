import { dirname, join } from "https://deno.land/std@0.122.0/path/mod.ts"

// a helper object for resolving template paths
export const TemplatePath = {
  resolve(path: string, parent: string): string {
    // if this is a relative path, resolve against parent dir
    if (path.startsWith(".")) {
      return join(dirname(parent), path)
    }
    // else, this is absolute
    else {
      return path
    }
  }
}