// -- types --
// a template event
export type TemplateEvent =
  | {
    name: "include",
    child: string,
    parent: string
  }
  | {
    name: "query"
    query: string,
    parent: string
  }

// -- impls --
export const TemplateEvent = {
  // creates an include event
  include: (child: string, parent: string): TemplateEvent => ({
    name: "include",
    child,
    parent
  }),
  // creates a query event
  query: (query: string, parent: string): TemplateEvent => ({
    name: "query",
    query,
    parent
  })
}