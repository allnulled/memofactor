const memory = class {
  static subclasses = {
    connection: memory_connection,
    logger: basic_logger,
    socket: basic_socket,
  };
  static default_options = {
    file: __current_directory + "/memory.sqlite",
    trace: true,
    traits: {},
  };
  static create(options_arg = {}) {
    return (new this(options_arg)).start();
  }
  static create_connection(options_arg = {}) {
    return (new this(options_arg)).get_connection();
  }
  constructor(options_arg = {}) {
    this.is_nodejs = typeof global !== "undefined";
    this.is_browser = typeof window !== "undefined";
    this.options = Object.assign({}, this.constructor.default_options, options_arg);
    this.logger = new this.constructor.subclasses.logger(this);
    this.socket = new this.constructor.subclasses.socket(this);
    this.connection = undefined;
    this.traits = {};
    this.initial_traits = this.options.traits || {};
  }
  start() {
    this.logger.trace("start", arguments);
    return this.get_connection().then(() => {
      return this;
    });
  }
  async awake_socket() {
    this.logger.trace("awake_socket", arguments);
    try {
      await this.socket.awake();
    } catch (error) {
      this.logger.error("awake_socket", error, true);
    }
  }
  async sleep_socket() {
    this.logger.trace("sleep_socket", arguments);
    try {
      await this.socket.sleep();
    } catch (error) {
      this.logger.error("sleep_socket", error, true);
    }
  }
  async mount_traits(traits = {}) {
    this.logger.trace("mount_traits", arguments);
    try {
      const all_traits = Object.assign({}, this.initial_traits ?? {}, traits);
      this.initial_traits = false;
      const trait_ids = Object.keys(all_traits);
      const mounted_traits = [];
      To_mount_event:
      for(let index_id=0; index_id<trait_ids.length; index_id++) {
        const trait_id = trait_ids[index_id];
        if(trait_id in this.traits) {
          throw new Error("Required 'trait_id' «" + trait_id + "» on index «" + index_id + "» to not exist in 'this.traits' on «mount_traits»");
        }
        const trait_class = all_traits[trait_id];
        const trait_instance = new trait_class(this);
        await trait_instance.on_mount();
        this.traits[trait_id] = trait_instance;
        mounted_traits.push(trait_instance);
      }
      To_mounted_event:
      for(let index_trait=0; index_trait<mounted_traits.length; index_trait++) {
        const mounted_trait = mounted_traits[index_trait];
        await mounted_trait.on_mounted();
      }
    } catch (error) {
      this.logger.error("mount_traits", error, true);
    }
  }
  async unmount_traits(trait_ids) {
    this.logger.trace("unmount_traits", arguments);
    try {
      if(!Array.isArray(trait_ids)) {
        trait_ids = [trait_ids];
      }
      const unmounted_traits = [];
      To_unmount_event:
      for(let index_trait=0; index_trait<trait_ids.length; index_trait++) {
        const trait_id = trait_ids[index_trait];
        if(!(trait_id in this.traits)) {
          console.log(this.traits);
          throw new Error("Required 'trait_id' «" + trait_id + "» on index «" + index_trait + "» to exist in 'this.traits' on «unmount_traits»");
        }
        const unmounted_trait = this.traits[trait_id];
        unmounted_trait.on_unmount();
        delete this.traits[trait_id];
        unmounted_traits.push(unmounted_trait);
      }
      To_unmounted_event:
      for(let index_trait=0; index_trait<unmounted_traits.length; index_trait++) {
        const unmounted_trait = unmounted_traits[index_trait];
        await unmounted_trait.on_unmounted();
      }
    } catch (error) {
      this.logger.error("unmount_traits", error, true);
    }
  }
  async get_connection() {
    this.logger.trace("get_connection", arguments);
    try {
      if (this.connection) {
        return this.connection;
      }
      this.connection = new this.constructor.subclasses.connection(this);
      await this.connection.get_native_connection();
      await this.awake_socket();
      await this.mount_traits();
      return this.connection;
    } catch (error) {
      this.logger.error("get_connection", error, true);
    }
  }
};