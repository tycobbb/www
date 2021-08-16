import { Path } from "../../../Core/mod.ts"
import { Config } from "../../Config/mod.ts"
import { PageRepo } from "../../Page/mod.ts"
import { FileEvents, FileEvent } from "../../File/mod.ts"

// process a change to a single (non-directory) file
export class ProcessFile {
  // -- module --
  static get = () => new ProcessFile()

  // -- deps --
  #cfg: Config
  #pages: PageRepo
  #evts: FileEvents

  // -- lifetime --
  constructor(
    cfg = Config.get(),
    pages = PageRepo.get(),
    evts = FileEvents.get()
  ) {
    this.#cfg = cfg
    this.#pages = pages
    this.#evts = evts
  }

  // -- command --
  call(path: Path) {
    switch (path.extension()) {
      case ".p.html":
        // TODO: probably makes more sense to add stuff to a PageGraph than
        // to a repo at this stage so we can resolve components later. it's
        // a factory for pages basically.
        this.#pages.addPage(path); break;
      case ".l.html":
        this.#pages.addLayout(path); break;
      default:
        this.#evts.add(FileEvent.copyFile(path)); break;
    }
  }
}
