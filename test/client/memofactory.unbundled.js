(function(factory) {
      const lib = factory();
      if(typeof window !== 'undefined') {
        window.memofactory = lib;
      }
      if(typeof global !== 'undefined') {
        global.memofactory = lib;
      }
      if(typeof module !== 'undefined') {
        module.exports = lib;
      }
    })(function() {
      // const express = require("express");
// const body_parser = require("body-parser");
const is_browser = typeof window !== "undefined";
const is_nodejs = typeof global !== "undefined";
const __current_directory = is_nodejs ? __dirname : "/default";
const basic_logger = class {
  constructor(memory) {
    this.memory = memory;
  }
  trace(method, parameters = [], ...args) {
    if (this.memory.options.trace) {
      console.log("[memory][trace][" + method + "]", parameters.length, Array.from(parameters).map(p => typeof p), ...args);
    }
  }
  log(...args) {
    console.log("[memory][log]", ...args);
  }
  debug(...args) {
    console.log("[memory][debug]", ...args);
  }
  sql_color_ini = "\x1b[34m";
  sql_color_end = "\x1b[0m";
  debug_sql(sql) {
    if(this.is_nodejs) {
      console.log(this.sql_color_ini + sql.trimLeft() + this.sql_color_end);
    } else {
      console.log("%c " + sql.trimLeft(), "font-weight: bold; color: red; background-color: yellow;");
    }
  }
  error(method, error, propagate = false) {
    console.log("[memory][error][" + method + "]", error);
    if(propagate) {
      throw error;
    }
  }
}
const basic_templates = class {
  constructor(memory) {
    this.memory = memory;
    this.logger = memory.logger;
  }
  parse_json(json) {
    return JSON.parse(json);
  }
  stringify_json(data) {
    return JSON.stringify(data);
  }
  sanitize_json(json) {
    return this.sanitize(this.stringify_json(json));
  }
  sanitize(t) {
    return "'" + (t + "").replace(/'/g, "''") + "'";
    return require("sqlstring").escape(t);
  }
  sanitize_id(t) {
    return "`" + t.replace(/`/g, "") + "`";
    return require("sqlstring").escapeId(t);
  }
  consonants = "bdfjklmnpqrstxz";
  vocals = "aeiou";
  get_random_character(only_vocal = false) {
    // this.logger.trace("templates.get_random_character", arguments);
    const muestra = only_vocal ? this.vocals : this.consonants;
    return muestra[Math.floor(Math.random() * muestra.length)];
  }
  get_random_string(len = 20) {
    this.logger.trace("templates.get_random_string", arguments);
    let text = "";
    while(text.length < len) {
      text += this.get_random_character((text.length === 0) || (text.length % 2 === 0));
    }
    return text;
  }
  sql_where(where, prefix_and = false) {
    this.logger.trace("templates.sql_where", arguments);
    if(!Array.isArray(where)) {
      throw new Error("Required parameter «where» to be an array on «sql_where»");
    }
    if(where.length === 0) {
      return "";
    }
    let sql = "";
    if(prefix_and) {
      sql += " AND ";
    }
    Iterating_where_rules:
    for(let index_rule=0; index_rule<where.length; index_rule++) {
      const where_rule = where[index_rule];
      const [subj, op, compl] = where_rule;
      sql += this.sanitize_id(subj);
      if((op === "is null") || (op === "is not null")) {
        sql += " ";
        sql += this.sanitize_sql_operator(op);
        continue Iterating_where_rules;
      } else if((op === "in") || (op === "not in")) {
        sql += " ";
        sql += this.sanitize_sql_operator(op);
        sql += " ";
        sql += this.sql_array_for_in(compl);
      } else {
        sql += " ";
        sql += this.sanitize_sql_operator(op);
        sql += " ";
        sql += this.sanitize(compl);
      }
    }
    return sql;
  }
  sql_operators = {
    "=": "=",
    "!=": "!=",
    "<": "<",
    "<=": "<=",
    ">": ">",
    ">=": ">=",
    "is null": "is null",
    "is not null": "is not null",
    "like": "like",
    "not like": "not like",
    "in": "in",
    "not in": "not in",
  };
  sanitize_sql_operator(op) {
    this.logger.trace("templates.sanitize_sql_operator", arguments);
    if(!(op in this.sql_operators)) {
      throw new Error("SQL operator not recognized: «" + op + "»");
    }
    return this.sql_operators[op];
  }
  sql_array_for_in(list) {
    this.logger.trace("templates.sql_array_for_in", arguments);
    let sql = "";
    sql += "(";
    for(let index=0; index<list.length; index++) {
      const item = list[index];
      sql += index === 0 ? "" : ", ";
      sql += this.sanitize(item);
    }
    sql += ")";
    return sql;
  }
  sql_order_by(order) {
    this.logger.trace("templates.sql_order_by", arguments);
    if(!Array.isArray(order)) {
      throw new Error("Required parameter «order» to be an array on «sql_order_by»");
    }
    if(order.length === 0) {
      order.push(["id", "DESC"]);
      order.push(["name", "DESC"]);
    }
    let sql = "";
    sql += "";
    for(let index_rule=0; index_rule<order.length; index_rule++) {
      const order_rule = order[index_rule];
      let col = undefined;
      let dir = "DESC";
      if(Array.isArray(order_rule)) {
        [col, dir = "DESC"] = order_rule;
      } else {
        col = order_rule;
      }
      sql += index_rule === 0 ? "" : ", ";
      sql += this.sanitize_id(col);
      sql += " ";
      if(["ASC","DESC"].indexOf(dir) === -1) {
        throw new Error(`Required parameter «order.${index_rule}» to specify a valid direction on «sql_order_by»`);
      }
      sql += dir;
    }
    sql += "";
    return sql;
  }
  sql_insert_values(values_list, fields) {
    this.logger.trace("templates.sql_insert_values", arguments);
    if(!Array.isArray(values_list)) {
      values_list = [values_list];
    }
    let sql = "";
    Iterating_values: 
    for(let index_value=0; index_value<values_list.length; index_value++) {
      const value = values_list[index_value];
      if(index_value !== 0) {
        sql += ",\n";
      }
      sql += "(";
      let sql_fields = "";
      Set_name_and_data_and_priority_before_indexed_columns: {
        sql_fields += "\n  ";
        sql_fields += this.sanitize(value.name ?? this.get_random_string(20));
        sql_fields += ",\n  ";
        sql_fields += this.sanitize_json(value);
        sql_fields += ",\n  ";
        sql_fields += this.sanitize(value.priority ?? 0);
      }
      Iterating_fields:
      for(let index_field=0; index_field<fields.length; index_field++) {
        const field = fields[index_field];
        sql_fields += ",";
        sql_fields += "\n  ";
        if(field in value) {
          sql_fields += this.sanitize(value[field]);
        } else {
          sql_fields += "NULL";
        }
      }
      sql += sql_fields;
      sql += "\n)";
    }
    return sql;
  }
  sql_update_set(values) {
    this.logger.trace("templates.sql_update_set", arguments);
    if(typeof values !== "object") {
      throw new Error("Required parameter «values» to be an object on «sql_update_set»");
    }
    let sql = "";
    for(let prop in values) {
      const value = values[prop];
      if(sql.length) {
        sql += ",";
      }
      sql += "\n  ",
      sql += this.sanitize_id(prop);
      sql += " = ",
      sql += this.sanitize(value);
    }
    return sql;
  }
}
const basic_socket = class {
  constructor(memory) {
    this.memory = memory;
    this.logger = memory.logger;
    this.connection = memory.connection;
    this.native_socket = undefined;
    // @code.start: socket-server-props | @propiedades concretas: estas propiedades se encienden si es un socket-server.
    this.application = undefined;
    this.server = undefined;
    this.socket_io_server = undefined;
    // @code.end: socket-server-props
    // @code.start: socket-client-props | @propiedades concretas: estas propiedades se encienden si es un socket-client.
    
    // @code.end: socket-client-props
  }
  is_awake() {
    this.logger.trace("is_awake", arguments);
  }
async dispatch_server_connection(user_socket) {

}

  async deploy_server() {
    try {
      const express = require("express");
      const body_parser = require("body-parser");
      const app = express();
      const http = require("http");
      const server = http.createServer(app);
      const socket_io = require("socket.io");
      const socket_io_server_class = socket_io.Server;
      const socket_io_server = new socket_io_server_class(server);
      Add_basic_routes: {
        app.get("/", (request, response) => {
          return response.status(200).json({message:"Hello, I am a memofactor!"});
        });
      }
      Add_basic_socket_events: {
        socket_io_server.on("connection", this.dispatch_server_connection);
      }
      Deploy_server: {
        return await new Promise((resolve, reject) => {
          server.listen(9009, () => {
            return resolve();
          });
        });
      }
      
    } catch (error) {
      this.logger.error("deploy_server", error, true);
    }
  }
  async deploy_client() {
    try {
      
    } catch (error) {
      this.logger.error("deploy_client", error, false);
    }
  }
  awake() {
    this.logger.trace("awake", arguments);
    if(this.memory.is_nodejs) {
      return this.deploy_server();
    } else {
      return this.deploy_client();
    }
  }
  sleep() {
    this.logger.trace("sleep", arguments);
    if(this.memory.is_nodejs) {
      // @TODO:
    } else {
      // @TODO:
    }
  }
}
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
const memory_connection = class extends basic_templates {
  constructor(memory) {
    super(memory);
    this.native_connection = undefined;
  }
  async get_native_connection(refresh = false) {
    this.logger.trace("connection.get_native_connection", arguments);
    // @nota: cacheamos igual en cualquier entorno.
    if (this.native_connection && !refresh) {
      return this.native_connection;
    }
    if (this.memory.is_nodejs) {
      const path = require("path");
      const sqlite3 = require("sqlite3");
      return await new Promise((resolve, reject) => {
        const db_path = path.resolve(this.memory.options.file);
        this.native_connection = new sqlite3.Database(db_path, (error) => {
          if (error) {
            return reject(error);
          }
          return resolve(this.native_connection);
        });
      });
    } else {
      const sqlite3api = await new Promise((resolve, reject) => {
        sqlite3InitModule().then(api => {
          resolve(api);
        });
      });
      const sqlite3 = sqlite3api.sqlite3;
      const db = new sqlite3.oo1.DB("/myfirstdb.sqlite", "ct");
      this.native_connection = db;
      return this.native_connection;
    }
  }
  async query(sql) {
    try {
      this.logger.trace("connection.query", arguments);
      if (this.memory.is_nodejs) {
        const native_connection = await this.get_native_connection();
        this.logger.debug_sql(sql);
        const result = await new Promise((resolve, reject) => {
          native_connection.all(sql, (error, rows) => {
            if (error) {
              return reject(error);
            }
            return resolve(rows);
          });
        });
        return result;
      } else {
        const native_connection = await this.get_native_connection();
        this.logger.debug_sql(sql);
        return native_connection.exec({
          sql,
          rowMode: "object",
          returnValue: "resultRows"
        });
      }
    } catch (error) {
      this.logger.error("query", error);
      throw error;
    }
  }
  async get_schema(force = false) {
    this.logger.trace("connection.get_schema", arguments);
    if (this.schema && !force) {
      return this.schema;
    }
    const tablas = await this.query("SELECT name FROM sqlite_master WHERE type='table'");
    const infoBaseDeDatos = [];
    Iterating_tables:
    for (const { name: nombreTabla } of tablas) {
      if (nombreTabla === "sqlite_sequence") {
        // continue Iterating_tables;
      }
      const columnas = await this.query(`PRAGMA table_info(${nombreTabla})`);
      const clavesForaneas = await this.query(`PRAGMA foreign_key_list(${nombreTabla})`);
      const columnasConFK = columnas.map((col) => {
        const claveFK = clavesForaneas.find((fk) => fk.from === col.name);
        return Object.assign({
          name: col.name,
          type: col.type,
        },
          col.pk === 1 ? { is_pk: true } : {},
          claveFK ? { foreign_key: { tablaDestino: claveFK.table, columnaDestino: claveFK.to } } : {}
        );
      });
      infoBaseDeDatos.push({
        table: nombreTabla,
        columns: columnasConFK,
      });
    }
    this.schema = infoBaseDeDatos;
    return this.schema;
  }
  reset_connection() {
    this.logger.trace("connection.reset_database", arguments);
    return this.get_native_connection(true);
  }
  reset_database() {
    this.logger.trace("connection.reset_database", arguments);
    const fs = require("fs");
    fs.unlinkSync(this.memory.options.file);
    fs.writeFileSync(this.memory.options.file, "", "utf8");
    return this.reset_connection();
  }
  create_table(table, contents) {
    this.logger.trace("connection.create_table", arguments);
    return this.query(`
      CREATE TABLE ${this.sanitize_id(table)} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        priority INTEGER NOT NULL DEFAULT 0,
        data TEXT NOT NULL DEFAULT "{}"${contents ? ", " + contents : ""}
      );`);
  }
  drop_table(table) {
    this.logger.trace("connection.drop_table", arguments);
    return this.query(`DROP TABLE ${this.sanitize_id(table)};`);
  }
  create_column(table, column) {
    this.logger.trace("connection.create_column", arguments);
    return this.query(`ALTER TABLE ${this.sanitize_id(table)} ADD COLUMN ${this.sanitize_id(column)};`);
  }
  drop_column(table, column) {
    this.logger.trace("connection.drop_column", arguments);
    return this.query(`ALTER TABLE ${this.sanitize_id(table)} DROP COLUMN ${this.sanitize_id(column)};`);
  }
  select_by_id(table, id) {
    this.logger.trace("connection.select_by_id", arguments);
    return this.select(table, [["id", "=", id]]);
  }
  select_by_name(table, name) {
    this.logger.trace("connection.select_by_name", arguments);
    return this.select(table, [["name", "=", name]]);
  }
  async select(table, where = [], order = ["priority", "id"], limit = 0, offset = 0) {
    this.logger.trace("connection.select", arguments);
    try {
      if (!Array.isArray(where)) {
        throw new Error("Required parameter «where» to be an array on «select»");
      }
      if (!Array.isArray(order)) {
        throw new Error("Required parameter «order» to be an array on «select»");
      }
      if (typeof limit !== "number") {
        throw new Error("Required parameter «limit» to be a number on «select»");
      }
      if (typeof offset !== "number") {
        throw new Error("Required parameter «offset» to be a number on «select»");
      }
      let sql = "";
      sql += "\nSELECT * \nFROM ";
      sql += this.sanitize_id(table);
      sql += "\nWHERE 1 = 1\n";
      sql += this.sql_where(where, true);
      sql += "\nORDER BY ";
      sql += this.sql_order_by(order, true);
      sql += "\nLIMIT ";
      sql += this.sanitize(limit === 0 ? -1 : limit);
      sql += "\nOFFSET ";
      sql += offset;
      sql += ";";
      return await this.query(sql);
    } catch (error) {
      this.logger.error("select", error, true);
    }
  }
  insert_one(table, values, fields = undefined) {
    this.logger.trace("connection.insert_one", arguments);
    return this.insert(table, [values], fields);
  }
  async insert(table, values_list) {
    this.logger.trace("connection.insert", arguments);
    try {
      const schema = await this.get_schema();
      const matched_tables = schema.filter(t => t.table === table);
      if (!matched_tables.length) {
        throw new Error("Required parameter «table» to exist in database schema on «insert»");
      }
      const table_schema = matched_tables[0];
      const columns = table_schema.columns.map(c => c.name).filter(c => c !== "id");
      let sql = "";
      sql += "\nINSERT INTO ";
      sql += this.sanitize_id(table);
      sql += " (\n  `name`,\n  `data`,\n  `priority`";
      const fields = [];
      let sql_fields = "";
      Iterating_columns:
      for (let index_columns = 0; index_columns < columns.length; index_columns++) {
        const column = columns[index_columns];
        if (["id", "name", "data", "priority"].indexOf(column) !== -1) {
          continue Iterating_columns;
        }
        sql_fields += ",";
        sql_fields += "\n  ";
        sql_fields += this.sanitize_id(column);
        fields.push(column);
      }
      sql += sql_fields;
      sql += "\n) VALUES ";
      sql += this.sql_insert_values(values_list, fields);
      sql += ";";
      return await this.query(sql);
    } catch (error) {
      this.logger.error("insert", error, true);
    }
  }
  update_one_by_id(table, id, values) {
    this.logger.trace("connection.update_one_by_id", arguments);
    try {
      let sql = "";
      sql += "\nUPDATE ";
      sql += this.sanitize_id(table);
      sql += " SET \n  ";
      sql += this.sanitize_id("data");
      sql += " = ";
      sql += this.sanitize_json(values);
      sql += ",";
      sql += this.sql_update_set(values);
      sql += "\nWHERE 1 = 1 AND (\n  ";
      sql += this.sql_where([["id", "=", id]], false);
      sql += "\n);"
      return this.query(sql);
    } catch (error) {
      this.logger.error("update_one_by_id", error, true);
    }
    return this.update(table, [["id", "=", id]], values);
  }
  update_one_by_name(table, name, values) {
    this.logger.trace("connection.update_one_by_name", arguments);
    return this.update(table, [["name", "=", name]], values);
  }
  /**
   * @code.start: Método update
   * @$section: Operaciones CRUD. Update.
   * @explicación: el update es un poco extraño, por la columna data.
   * Lo que hace es:
   *   1. Un select de todos los coincidentes con el where.
   *   2. Un bucle para cada uno:
   *   2.1. Un extends del data actual con el values proporcionado
   *   2.2. Un update normal
   *     - hay que hacer un método, update_one_by_id sería
   *     - de forma totalmente asíncrona
   */
  async update(table, where, values) {
    this.logger.trace("connection.update", arguments);
    try {
      if (typeof values !== "object") {
        throw new Error("Required parameter «values» to be an object on «update»");
      }
      if (!Array.isArray(where)) {
        throw new Error("Required parameter «where» to be an array on «update»");
      }
      const selection = await this.select(table, where);
      const all_promises = [];
      for (let index_row = 0; index_row < selection.length; index_row++) {
        try {
          const selected = selection[index_row];
          const current_data = this.parse_json(selected.data);
          const id = selected.id;
          const changed_data = Object.assign(current_data, values);
          const update_promise = this.update_one_by_id(table, id, changed_data);
          all_promises.push(update_promise);
        } catch (error) {
          this.handle_update_async_error(error);
        }
      }
      return await Promise.all(all_promises);
    } catch (error) {
      this.logger.error("update", error, true);
    }
  }
  // @code.end: Método update
  handle_update_async_error(error) {
    this.logger.error("handle_update_async_error", error, true);
  }
  delete_one_by_id(table, id) {
    this.logger.trace("connection.delete_one_by_id", arguments);
    return this.delete(table, [["id", "=", id]]);
  }
  delete_one_by_name(table, name) {
    this.logger.trace("connection.delete_one_by_name", arguments);
    return this.delete(table, [["name", "=", name]]);
  }
  async delete(table, where) {
    this.logger.trace("connection.delete", arguments);
    try {
      // @TODO!!!!
      let sql = "";
      sql += "\nDELETE FROM ";
      sql += this.sanitize_id(table);
      sql += "WHERE 1 = 1 AND (\n  ";
      sql += this.sql_where(where, false);
      sql += "\n);"
      return await this.query(sql);
    } catch (error) {
      this.logger.error("delete", error, true);
    }
  }
}
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
return {
  basic_logger,
  basic_templates,
  basic_trait,
  memory_connection,
  memory
};

    });