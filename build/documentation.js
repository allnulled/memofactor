const main = async function () {
  try {
    const documentator_api = require(__dirname + "/documentator/src/documentator.api.js");
    documentator_api.parse_directory(__dirname + "/../src", {
      pipes: ["generate_html"],
      ignored: [
        "lib/ext/",
        "memofactory.js",
        "memofactory.unbundled.js",
      ],
      output_dir_html: require("path").resolve(__dirname + "/../docs/reference"),
      scripts: []
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = main();