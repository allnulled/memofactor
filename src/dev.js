require("chokidar").watch([
  __dirname + "/lib",
  __dirname + "/../test/test.js",
  __dirname + "/../test/client/index.html",
]).on("change", function(file) {
  delete require.cache[__dirname + "/build.js"];
  require(__dirname + "/build.js");
  require("child_process").spawnSync("npm", ["run", "test"], {
    stdio: [process.stdin, process.stdout, process.stderr]
  });
});