// an interface for a command
export interface Action {
  // invokes the command, returning a promise
  call(): Promise<void>

  // if the action starts a background process
  get isProcess(): boolean
}
