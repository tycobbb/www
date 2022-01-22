// an shared ref to a disposable object
export class Ref<T> {
  // -- props --
  // the underlying reference
  #ref: T | null

  // -- lifetime --
  // create a new ref
  constructor(ref: T) {
    this.#ref = ref
  }

  // -- commands --
  // delete the underlying reference
  delete() {
    this.#ref = null
  }

  // -- queries --
  // get the underlying reference, if it exists
  deref(): T | null {
    return this.#ref
  }
}