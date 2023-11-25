import { HtmlElement, HtmlNode } from "../Html/mod.ts";

// -- types --
// compiles an html node sequence
export interface TemplateHtmlCompiler {
  // compile the html
  compile(nodes: HtmlNode[]): string
}

// compiles an individual html element
export interface TemplateHtmlElementCompiler {
  // compile the html element, if possible
  compile(el: HtmlElement, html: TemplateHtmlCompiler): string | null
}
