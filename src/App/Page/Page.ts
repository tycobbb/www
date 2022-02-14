import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.21-alpha/deno-dom-wasm.ts"
import { File, FilePath } from "../File/mod.ts"

// an html page in the built site
export class Page {
  // -- props --
  // the raw file path
  #path: FilePath

  // the raw html string
  #text: string

  // -- lifetime --
  constructor(path: FilePath, text: string) {
    this.#path = path
    this.#text = text
  }

  // -- commands --
  // compile the page, producing a `File`
  render(): File {
    const m = this

    // parse the document
    const doc = new DOMParser().parseFromString(m.#text, "text/html")
    if (doc == null) {
      throw new Error("no doc")
    }

    const $doc = doc.documentElement
    if ($doc == null) {
      throw new Error("no doc el")
    }

    // merge elements into the head
    const $head = doc.head

    // merge nested <w:head> elements
    const $heads = doc.getElementsByTagName("w:head")
    for (const $h of $heads) {
      // merge the contents
      // TODO: merge based on type? (e.g. 1 title)
      for (const $hc of Array.from($h.childNodes)) {
        $head.insertBefore($hc, $head.firstChild)
      }

      // and remove the wrapper
      $h.remove()
    }

    // merge elements with a w:head=<id> attr
    const $hcs = Array.from(doc.querySelectorAll("body *[w:head]")) as Element[]
    for (const $hc of $hcs) {
      // remove the attr
      // TODO: merge based on id
      $hc.removeAttribute("w:head"ut)

      // and add it to the head
      $head.insertBefore($hc, $head.firstChild)
    }

    // replace <w:template> elements w/ their contents
    const $tmpls = doc.getElementsByTagName("w:template")
    for (const $t of $tmpls) {
      $t.replaceWith(...$t.childNodes)
    }

    // create the file
    const file: File = {
      path: m.#path.setExt("html"),
      text: $doc.outerHTML,
    }

    return file
  }
}
