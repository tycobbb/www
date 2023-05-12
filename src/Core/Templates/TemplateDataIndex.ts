// -- types --
// all data available to templates
export interface TemplateDataIndex extends TemplateDataTable {
  // TODO: make this key configurable?
  pages: TemplateDataTable<Record<string, unknown>>
}

// all data available to templates
export interface TemplateDataTable<T = unknown> {
  [key: string | symbol]: T
}