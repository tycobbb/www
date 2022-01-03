import { assert, assertEquals, assertMatch } from "https://deno.land/std@0.105.0/testing/asserts.ts"

// -- asserts --
// asserts the value is null
export function assertLength<T>(actual: T[], expected: number) {
  assert(actual.length === expected, `${actual} did not have length of ${expected}`)
}

// asserts the actual string contains the substring
export function assertIncludes(actual: string, substring: string) {
  assert(actual.includes(substring), `${actual} did not include ${substring}`)
}

// asserts the actual string does not contain the substring
export function assertNotIncludes(actual: string, substring: string) {
  assert(!actual.includes(substring), `${actual} included ${substring}`)
}

// -- reexports --
export { assert, assertEquals, assertMatch }
