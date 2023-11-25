import { Factory } from "./Core.ts";
import { EtaConfig } from "https://deno.land/x/eta@v1.12.3/config.ts";

// -- factories --
export const makeEtaConfig: Factory<EtaConfig> = (overrides) => ({
  // we're going to cheat in this factory, pass the props you need
  // deno-lint-ignore no-explicit-any
  ...{} as any,
  ...overrides
})
