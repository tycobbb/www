// an interface for a command
export interface Action {
  // invokes the command, returning a promise
  call(): Promise<void>

  // if the command should be run serially
  get isSerial(): boolean
}
