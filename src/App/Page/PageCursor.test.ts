import { Ref } from "../../Core/Ref.ts";
import { assert, MockNode } from "../../Test/mod.ts"
import { PageCursor } from "./PageCursor.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it is dirty if any of its dependencies are dirty", () => {
  const cursor = new PageCursor()

  const deps = [new MockNode(), new MockNode()]
  const refs = deps.map((dep) => new Ref(dep))

  cursor.addDependency(refs[0])
  cursor.addDependency(refs[1])

  assert(!cursor.isDirty)

  deps[1].flag()
  assert(cursor.isDirty)
})