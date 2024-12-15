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