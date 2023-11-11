// -- types --
// a data format to decode mapping
export interface PageDataType {
  format: string,
  decode: (text: string) => unknown
}

// -- impls --
// a repo of page data types
export class PageDataTypes {
  // -- props --
  // a map of data decode fns by file format
  #decode: Map<string, PageDataType["decode"]> = new Map()

  // -- commands --
  // register the data type
  add(dataType: PageDataType) {
    this.#decode.set(dataType.format, dataType.decode)
  }

  // -- queries --
  // decode data text based on format; throws if format is unregistered
  decode(format: string, text: string): unknown {
    const decode = this.#decode.get(format)
    if (decode == null) {
      throw new PageDataTypes.MissingType(Array.from(this.#decode.keys()))
    }

    return decode(text)
  }

  // -- errors --
  static MissingType = class extends Error {
    // -- props --
    #types: string[]

    // -- lifetime --
    constructor(types: string[]) {
      super()
      this.#types = types
    }

    // -- queries --
    toString() {
      return `${this.#types.join(", ")}`
    }
  }
}