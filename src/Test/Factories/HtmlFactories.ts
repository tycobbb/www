import { Factory } from "./Core.ts";
import { HtmlElement } from "../../Core/Html/Html.ts";

// -- factories --
export const makeElement: Factory<HtmlElement> = (overrides) => ({
  name: "",
  attrs: {},
  children: null,
  ...overrides
})
