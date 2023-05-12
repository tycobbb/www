import { assert, MockNode } from "../../Test/mod.ts"
import { Path, Ref } from "../../Core/mod.ts"
import { FileRef } from "../File/mod.ts"
import { PageNode } from "./PageNode.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("it purges deleted dependents", () => {
  const node = new PageNode(FileRef.init(Path.raw("test")))
  const deps = [new MockNode(), new MockNode()]
  const refs = deps.map((dep) => new Ref(dep))

  node.addDependent(refs[0])
  node.addDependent(refs[1])
  refs[0].delete()

  node.flag()
  assert(deps[0].isDirty == false)
  assert(deps[1].isDirty == true)
})

test("it purges deleted dependencies", () => {
  const node = new PageNode(FileRef.init(Path.raw("test")))
  const deps = [new MockNode(), new MockNode()]
  const refs = deps.map((dep) => new Ref(dep))

  node.addDependency(refs[0])
  node.addDependency(refs[1])
  deps[0].flag()
  refs[0].delete()

  assert(node.isReady())
})
