https://gitlab.com/xmpp-rs/xmpp-rs/-/tree/main/minidom

maybe preprocess custom elements into eta includes so we can do something like slots:

```html
<w:include path="window.f.html" name="nav" top=5>
  <w:include w:slot="body" name="nav" />

  <div w:slot="footer">
    footer
  </div>
</w:include>
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
    `
  `})
%>
```