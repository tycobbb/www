// a command that finds all matching paths for a query
export interface TemplateQueryMatch {
  // finds all matching paths for a query
  (query: string): string[]
}