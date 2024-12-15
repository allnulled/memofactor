const fs = require("fs");
const path = require("path");
const dir = path.resolve(__dirname);
// @code.start: allinone_list | @reference: src.build.js.allinone.ref
const allinone_list = [
  "lib/imports.js",
  "lib/basic_logger.js",
  "lib/basic_templates.js",
  "lib/basic_socket.js",
  "lib/basic_trait.js",
  "lib/memory_connection.js",
  "lib/memory.js",
  "lib/ext/sqlite3.js",
  "lib/ext/socket.io-client.js",
  "lib/ext/ufs.js",
  "lib/exports.js",
];
// @code.end: allinone_list
// @code.start: separated_list | @reference: src.build.js.separated.ref
const separated_list = [
  "lib/imports.js",
  "lib/basic_logger.js",
  "lib/basic_templates.js",
  "lib/basic_socket.js",
  "lib/basic_trait.js",
  "lib/memory_connection.js",
  "lib/memory.js",
  // "lib/ext/sqlite3.js",
  // "lib/ext/socket.io-client.js",
  // "lib/ext/ufs.js",
  "lib/exports.js",
];
// @code.end: separated_list

const bundle = function (list, output_file) {
  let source = "";
  for (let index = 0; index < list.length; index++) {
    const item = list[index];
    const content = fs.readFileSync(path.resolve(dir, item)).toString();
    source += content + "\n";
  }
  const wrap_in_umd = function (source, name) {
    let out = "";
    out += `(function(factory) {
      const lib = factory();
      if(typeof window !== 'undefined') {
        window.${name} = lib;
      }
      if(typeof global !== 'undefined') {
        global.${name} = lib;
      }
      if(typeof module !== 'undefined') {
        module.exports = lib;
      }
    })(function() {
      ${source}
    });`;
    return out;
  }
  source = wrap_in_umd(source, "memofactory");
  fs.writeFileSync(dir + "/../dist/" + output_file, source, "utf8");
  fs.writeFileSync(dir + "/../test/client/" + output_file, source, "utf8");
};

bundle(allinone_list, "memofactory.js");
bundle(separated_list, "memofactory.unbundled.js");