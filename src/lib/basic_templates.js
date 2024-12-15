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