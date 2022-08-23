# notes

## libs

this might be useful if to bridge into deno if deno-dom proves to be slow:
https://gitlab.com/xmpp-rs/xmpp-rs/-/tree/main/minidom

## includes

create a build-time include element w/ something like slots. eta's include syntax falls
down on complex partials imo, pretty cumbersome. preprocess:

```html
<w:frag path="window" name="nav" top=5>
  <w:frag
    path="nav"
    w:slot="body"
  />

  <div w:slot="footer">
    footer
  </div>
</w:frag>
```

into

```html
<%~
  include("window.f.html", {
    name: "nav",
    top: 5,
    body: `
      <nav class="Nav">
        <ul>
          <li><a href="/">home</a></li>
        </ul>
      </nav>
    `,
    footer: `
      <div w:slot="footer">
        footer
      </div>
    `
  `})
%>
```

can punt on nested includes if it's too much work. eta can't seem to handle nested
includes, so we'd have to precompile all of them.

## html-escaping

auto-escape html in code blocks? as a config option?