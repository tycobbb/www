import {
  AssertionError,
  assert,
  assertEquals,
  assertMatch,
  assertThrows,
  assertRejects,
} from "https://deno.land/std@0.122.0/testing/asserts.ts"

import {
  ParserResult,
  ParserStatus as PS
} from "../Core/Parser/mod.ts"

// -- asserts --
// asserts the value is null
export function assertLength<T>(actual: T[], expected: number) {
  assert(
    actual.length === expected,
    `\nexpected\n  ${actual}\nto have length\n  ${expected}\nbut it was\n  ${actual.length}`
  )
}

// asserts the actual string contains the substring
export function assertIncludes(actual: string, substring: string) {
  assert(
    actual.includes(substring),
    `\nexpected\n  "${actual}"\nto include\n  "${substring}"\nbut it did not.`
  )
}

// asserts the actual string does not contain the substring
export function assertNotIncludes(actual: string, substring: string) {
  assert(
    !actual.includes(substring),
    `\nexpected\n  "${actual}"\nto not include\n  "${substring}"\nbut it did.`
  )
}

// asserts the actual set has the element
export function assertHas<T>(actual: Set<T>, element: T) {
  assert(
    actual.has(element),
    `\nexpected\n  ${actual}\nto have\n  ${element}\nbut it did not.`
  )
}

// asserts the actual value has a prototype
export function assertInstanceOf<T>(actual: unknown, type: new() => T) {
  assert(
    actual instanceof type,
    `\nexpected\n  ${actual}\nto be an instance of\n  ${type}\nbut it was not.`
  )
}

// asserts the values are partially equal given a selector
export function assertPartial<T, U>(actual: T, expected: T, select: (val: T) => U) {
  try {
    // check partial equality
    assertEquals(select(actual), select(expected))
  } catch (err) {
    // if failed, throw full equality error for a nicer diff
    if (err instanceof AssertionError) {
      assertEquals(actual, expected)
    }
    // if not test failure, just rethrow
    else {
      throw err
    }
  }
}

// assert the match of two results, ignoring error string
export function assertParser<V>(
  a: ParserResult<V>,
  e: ParserResult<V>,
) {
  assertPartial(a, e, (res) => {
    if (res.stat === PS.success) {
      return res
    }

    const { error: _, ...rest } = res
    return rest
  })
}

// -- reexports --
export {
  assert,
  assertEquals,
  assertMatch,
  assertThrows,
  assertRejects,
}
