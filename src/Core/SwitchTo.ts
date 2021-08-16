// a `debounce`, but you replace the entire fn instead of simply resetting
// its timeout
export function switchTo(delay: number, f: (() => void) | null = null) {
  let timeout: number | null = null

  function start(g: () => void) {
    if (timeout != null) {
      clearTimeout(timeout)
    }

    timeout = setTimeout(g, delay)
  }

  if (f != null) {
    start(f)
  }

  return start
}
