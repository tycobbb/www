import { InFn, OutFn } from "./Types.ts"

// -- types --
// a factory fn miroring the concrete types of its input
export type Factory<F extends InFn> =
  OutFn<F>

// -- impls --
// creates a transient service factory
export function transient<F extends InFn>(fn: F): Factory<F> {
  return fn
}

// creates a singleton service factory
export function single<F extends InFn>(fn: F): Factory<F> {
  let memo: ReturnType<F> | null = null
  return (...args) => memo ||= fn(...args)
}