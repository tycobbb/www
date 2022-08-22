import * as E from "https://deno.land/x/eta@v1.12.3/mod.ts"
import { EtaConfig } from "https://deno.land/x/eta@v1.12.3/config.ts"
import { EventStream } from "../Events.ts"
import { TemplateEvent } from "./TemplateEvent.ts"
import { TemplatePath } from "./TemplatePath.ts"

// -- constants --
// the base include fn
const kInclude: (path: string, cfg: EtaConfig) => unknown
  = E.config.include!.bind(E.config)

// -- types --
// a template data helper fn
type TemplateFragHelper
  = (path: string, args: { parent: string } & EtaConfig) => unknown

// a factory for constructing a helper with its dependencies
type TemplateFragHelperFactory = {
  helper: (
    evts: EventStream<TemplateEvent>
  ) => TemplateFragHelper
}

// -- impls --
// factory for template frag helpers
export const TemplateFrag: TemplateFragHelperFactory = {
  // create the helper from its deps
  helper: (evts) => (path, args) => {
    // resolve path against parent
    const { parent, ...rest } = args
    const child = TemplatePath.resolve(path, parent)

    // send include event
    evts.send(TemplateEvent.include(child, parent))

    // run original include w/ resolved path
    return kInclude(child, rest)
  }
}