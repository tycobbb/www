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

  const file = FileRef.init(Path.raw("test"))
  const node = new PageNode(file)
  index.add(node)

  assertEquals(index.get("test").val, node)
  assertEquals(index.getByFile(file).val, node)
})

test("it removes a node", () => {
  const index = new PageIndex()

  const file = FileRef.init(Path.raw("test"))
  const node = new PageNode(file)
  index.add(node)

  const nodeRef = index.get("test")
  index.delete("test")

  assert(!nodeRef.isPresent)
  assert(index.get("test") == null)
  assert(index.getByFile(file) == null)
})

test("it queries a path", () => {
  const index = new PageIndex()

  const cursor1 = index.query("posts/*")
  const cursor2 = index.query("posts/*")

  assert(cursor1 != null)
  assertIs(cursor1, cursor2)
})

test("it adds existing nodes to a query", () => {
  const index = new PageIndex()

  const note = new PageNode(FileRef.init(Path.raw("notes/test")))
  const post = new PageNode(FileRef.init(Path.raw("posts/test")))
  index.add(note)
  index.add(post)

  const posts = index.query("posts/*")

  note.flag()
  assert(!posts.val.isDirty)

  post.flag()
  assert(posts.val.isDirty)
})

test("it adds new nodes to a query", () => {
  const index = new PageIndex()
  const posts = index.query("posts/*")

  const note = new PageNode(FileRef.init(Path.raw("notes/test")))
  const post = new PageNode(FileRef.init(Path.raw("posts/test")))
  index.add(note)
  index.add(post)

  note.flag()
  assert(!posts.val.isDirty)

  post.flag()
  assert(posts.val.isDirty)
})

test("it matches paths against a query", () => {
  const index = new PageIndex()
  index.query("posts/*")

  index.add(new PageNode(FileRef.init(Path.raw("notes/test"))))
  index.add(new PageNode(FileRef.init(Path.raw("posts/test1"))))
  index.add(new PageNode(FileRef.init(Path.raw("posts/test2"))))

  const match = index.match("posts/*")
  assertEquals(match, ["posts/test1", "posts/test2"])
})