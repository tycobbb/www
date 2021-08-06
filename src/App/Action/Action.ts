export interface Action {
  call(): Promise<void>
}
