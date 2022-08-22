import { EventStream } from "../Events.ts"
import { TemplateEvent } from "./TemplateEvent.ts"

// -- types --
// data available to templates
export type TemplateData =
  { [key: string | symbol]: unknown }

// // -- impls --
// export const TemplateData = {
//   // create tempalte data that emits events on access
//   create(
//     path: string,
//     data: TemplateData,
//     evts: EventStream<TemplateEvent>
//   ) {
//     return new Proxy(data, {
//       get(target, p) {
//         evts.send(TemplateEvent.include(path, parent))
//         return target[p]
//       }
//     })
//   }
// }
