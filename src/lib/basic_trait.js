const basic_trait = class {
  priority = 0;
  constructor(memory) {
    this.memory = memory;
    this.connection = memory;
    this.logger = memory.logger;
  }
  on_mount() {
    // @OK
  }
  on_mounted() {
    // @OK
  }
  on_unmount() {
    // @OK
  }
  on_unmounted() {
    // @OK
  }
}