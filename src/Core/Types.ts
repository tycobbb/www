// a fn that takes in any args and produces something
export type InFn =
  // deno-lint-ignore no-explicit-any
  (...args: any[]) => any

// a fn that mirrors the concrete types of its input
export type OutFn<F extends InFn> =
  (...args: Parameters<F>) => ReturnType<F>