import { assert, MockNode } from "../../Test/mod.ts"
import { Ref, Path } from "../../Core/mod.ts";
import { FileRef } from "../File/FileRef.ts";
import { PageCursor } from "./PageCursor.ts"
import { PageNode } from "./PageNode.ts";

// -- setup --
const { test } = Deno

// -- tests --
test("it matches nodes", () => {
  const cursor = new PageCursor("posts")

  const note = new Ref(new PageNode("note", FileRef.init(Path.raw("notes/test"))))
  const post = new Ref(new PageNode("post", FileRef.init(Path.raw("posts/test"))))

  assert(cursor.match(note) == false)
  assert(cursor.match(post) == true)
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