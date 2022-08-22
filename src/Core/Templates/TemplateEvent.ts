// -- types --
// a template event
export type TemplateEvent =
  { kind: "include", child: string, parent: string }

// -- impls --
export const TemplateEvent = {
  /// creates an include event
  include(child: string, parent: string): TemplateEvent {
    return { kind: "include", child, parent }
  }
}