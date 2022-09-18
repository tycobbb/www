// -- types --
// a template event
export type TemplateEvent =
  { name: "include", child: string, parent: string }

// -- impls --
export const TemplateEvent = {
  /// creates an include event
  include(child: string, parent: string): TemplateEvent {
    return { name: "include", child, parent }
  }
}