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