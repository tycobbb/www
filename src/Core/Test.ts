import { assert } from "https://deno.land/std@0.103.0/testing/asserts.ts"

// asserts that the actual string contains the substring
export function assertIncludes(actual: string, substring: string) {
  assert(actual.includes(substring), `${actual} did not include ${substring}`)
}

// asserts that the actual string does not contain the substring
export function assertNotIncludes(actual: string, substring: string) {
  assert(!actual.includes(substring), `${actual} included ${substring}`)
}
