import { assert } from "../../Test/mod.ts"
import { Path, Ref } from "../../Core/mod.ts"
import { FileRef } from "../File/mod.ts"
import { PageNode, PageDependent } from "./PageNode.ts"

// -- setup --
const { test } = Deno

// -- tests --
test("PageNode ~ it purges deleted dependents", () => {
  const node = new PageNode(FileRef.init(new Path("test.p.html")))
  const deps = [new MockDependent(), new MockDependent()]
  const refs = deps.map((dep) => new Ref(dep))

  node.addDependent(refs[0])
  node.addDependent(refs[1])
  refs[0].delete()

  node.flag()
  assert(deps[0].isDirty == false)
  assert(deps[1].isDirty == true)
})

// -- mocks --
class MockDependent implements PageDependent {
  // -- props --
  isDirty = false

  // -- PageDependent --
  flag(): void {
    this.isDirty = true
  }
}
