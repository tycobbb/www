import { assert, assertEquals, assertIs } from "../../Test/mod.ts"
import { Path } from "../../Core/mod.ts";
import { FileRef } from "../File/mod.ts";
import { PageIndex } from "./PageIndex.ts"
import { PageNode } from "./PageNode.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it adds a node", () => {
  const index = new PageIndex()

  const node = new PageNode("test", FileRef.init(Path.raw("")))
  index.add(node)

  const nodeRef = index.get("test")
  assertEquals(nodeRef.val, node)
})

test("it removes a node", () => {
  const index = new PageIndex()

  const node = new PageNode("test", FileRef.init(Path.raw("")))
  index.add(node)

  const nodeRef = index.get("test")
  index.delete("test")

  assert(!nodeRef.isPresent)
  assert(index.get("test") == null)
})

test("it queries a path", () => {
  const index = new PageIndex()

  const cursor1 = index.query("posts/*")
  const cursor2 = index.query("posts/*")

  assert(cursor1 != null)
  assertIs(cursor1, cursor2)
})

test("it matches existing nodes to a query", () => {
  const index = new PageIndex()

  const note = new PageNode("note", FileRef.init(Path.raw("notes/test")))
  const post = new PageNode("post", FileRef.init(Path.raw("posts/test")))
  index.add(note)
  index.add(post)

  const posts = index.query("posts/*")

  note.flag()
  assert(!posts.isDirty)

  post.flag()
  assert(posts.isDirty)
})

test("it matches new nodes to a query", () => {
  const index = new PageIndex()
  const posts = index.query("posts/*")

  const note = new PageNode("note", FileRef.init(Path.raw("notes/test")))
  const post = new PageNode("post", FileRef.init(Path.raw("posts/test")))
  index.add(note)
  index.add(post)

  note.flag()
  assert(!posts.isDirty)

  post.flag()
  assert(posts.isDirty)
})