import { DOMParser, Element } from "https://deno.land/x/deno_dom@v0.1.21-alpha/deno-dom-wasm.ts"

// an html page in the built site
export class Page {
  // -- props --
  // the raw html string
  #text: string

  // -- lifetime --
  constructor(text: string) {
    this.#text = text
  }

  // -- commands --
  // compile the page, producing a `File`
  render(): string {
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
      for (const $hc of Array.from($h.children)) {
        m.#mergeHead($head, $hc)
      }

      // and remove the wrapper
      $h.remove()
    }

    // merge elements with a w:head=<id> attr
    const $hcs = Array.from(doc.querySelectorAll("body *[w:head]")) as Element[]
    for (const $hc of $hcs) {
      // remove the attr
      $hc.removeAttribute("w:head")

      // merge the element
      m.#mergeHead($head, $hc)
    }

    // replace <w:template> elements w/ their contents
    const $tmpls = doc.getElementsByTagName("w:template")
    for (const $t of $tmpls) {
      $t.replaceWith(...$t.childNodes)
    }

    // create the file
    return $doc.outerHTML
  }

  // merge an element into the head
  #mergeHead($head: Element, $el: Element) {
    // find the matching element
    let $src = null as Element | null
    if ($el.tagName === "TITLE") {
      $src = $head.querySelector("title")
    } else if ($el.id !== "") {
      $src = $head.getElementById($el.id)
    }

    // replace the match, or append it if none
    if ($src != null) {
      $src.replaceWith($el)
    } else {
      $head.appendChild($el)
    }
  }
}
