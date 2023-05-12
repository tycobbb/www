import * as E from "https://deno.land/x/eta@v1.12.3/mod.ts"


// a command that finds all matching paths for a query
export interface TemplateQueryMatch {
  // finds all matching paths for a query
  (query: string): string[]
}