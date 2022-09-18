// an shared ref to a disposable object
export class Ref<T> {
  // -- props --
  // the underlying reference
  #val: T | null

  // -- lifetime --
  // create a new ref
  constructor(val: T) {
    this.#val = val
  }

  // -- commands --
  // delete the underlying reference
  delete() {
    this.#val = null
  }

  // -- queries --
  // if the ref exists
  get isPresent(): boolean {
    return this.#val != null
  }

  // get the underlying reference, or throw an error if it doesn't
  get val(): T {
    const val = this.#val
    if (val == null) {
      throw new Error(`tried to unwrap null!`)
    }

    return val
  }
}