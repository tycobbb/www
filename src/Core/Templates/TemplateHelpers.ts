import { EtaConfig } from "https://deno.land/x/eta@v1.12.3/config.ts"

// -- impls --
// an eta plugin that exposts some helpers as global
export class TemplateHelpers {
  // -- constants --
  // the list of new (non-eta helpers)
  static readonly new = [
    "data",
    "frag"
  ]

  // the list of all helpers
  static readonly all = [
    ...TemplateHelpers.new,
    "layout",
    "include"
  ]

  // declarations for new global template helpers
  static readonly globals
    = TemplateHelpers.new.map((h) => `${h}=E.${h}.bind(E)`).join(",")

  // -- EtaPlugin --
  // add helpers as template globals
  processFnString(fnStr: string, _: EtaConfig) {
    return `var ${TemplateHelpers.globals}; ${fnStr}`
  }
}