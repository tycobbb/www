import { Paths } from "./Paths.ts"

export class Config {
  // -- props --
  paths: Paths

  // -- lifecycle --
  constructor(paths: Paths) {
    this.paths = paths
  }
}
