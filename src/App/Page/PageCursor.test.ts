import { assert, MockNode } from "../../Test/mod.ts"
import { Ref, Path } from "../../Core/mod.ts";
import { FileRef } from "../File/FileRef.ts";
import { PageCursor } from "./PageCursor.ts"
import { PageNode } from "./PageNode.ts";

// -- setup --
const { test } = Deno

// -- data --
const src = "testroot"

// -- tests --
test("it matches nodes", () => {
  const cursor = new PageCursor("posts/*")

  const note = new Ref(new PageNode(FileRef.init(Path.raw("notes/test", src))))
  const post = new Ref(new PageNode(FileRef.init(Path.raw("posts/test", src))))

  assert(cursor.match(note) == false)
  assert(cursor.match(post) == true)
})

test("it does not match the glob root", () => {
  const cursor = new PageCursor("posts/*")
  const posts = new Ref(new PageNode(FileRef.init(Path.raw("posts", src))))

  assert(cursor.match(posts) == false)
})

test("it is dirty if any of its dependencies are dirty", () => {
  const cursor = new PageCursor("")

  const deps = [new MockNode(), new MockNode()]
  const refs = deps.map((dep) => new Ref(dep))

  cursor.addDependency(refs[0])
  cursor.addDependency(refs[1])

  assert(!cursor.isDirty)

  deps[1].flag()
  assert(cursor.isDirty)
})