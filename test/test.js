let chai = undefined;
let expect = undefined;
let memofactory = undefined;
let memofactor = undefined;

describe("memofactory Test", function() {
  
  before(async function() {
    chai = await import("chai");
    expect = chai.expect;
  });

  before(async function() {
    const fs = require("fs");
    Kill_previous_pid: {
      try {
        process.kill(JSON.parse(fs.readFileSync(__dirname + "/pid.json").toString()).pid);
      } catch (error) {
        
      }
    }
    Persist_current_pid: {
      fs.writeFileSync(__dirname + "/pid.json", JSON.stringify({pid: process.pid}), "utf8");
    }
  });

  it("can load the api", async function() {
    memofactory = require(__dirname + "/../dist/memofactory.js");
    memofactor = memofactory.memory;
  });

  it("can create an instance and do the CRUD", async function() {
    const tables_order_creation = ["something"];
    const tables_order_deletion = tables_order_creation.reverse();
    const connection = await memofactor.create_connection({file: __dirname + "/databases/memofactory1.sqlite"});
    await connection.reset_database();
    await connection.create_table("something1", "random_text VARCHAR(100), created_at DATETIME, updated_at DATETIME");
    await connection.create_table("something2");
    await connection.create_table("something3");
    await connection.create_table("something4");
    let schema = await connection.get_schema();
    schema = schema.filter(t => t.table !== "sqlite_sequence").sort((a,b) => {
      const pos_a = tables_order_deletion.indexOf(a);
      const pos_b = tables_order_deletion.indexOf(b);
      return pos_a < pos_b ? 1 : -1;
    });
    await connection.insert("something1", { random_text: "wherever1"});
    await connection.insert("something1", [{ random_text: "wherever2" }, { random_text: "wherever3" }, { random_text: "wherever4" }]);
    await connection.insert("something1", [{ random_text: "wherever5" }, { random_text: "wherever6" }, { random_text: "wherever7" }]);
    const sel1 = await connection.select("something1", [["random_text","!=","wherever1"]]);
    expect(sel1[0].random_text).to.equal("wherever7");
    expect(sel1[1].random_text).to.equal("wherever6");
    expect(sel1[2].random_text).to.equal("wherever5");
    await connection.delete("something1", [["random_text", "=", "wherever5"]]);
    const sel2 = await connection.select("something1", [["random_text","!=","wherever1"]]);
    expect(sel2[0].random_text).to.equal("wherever7");
    expect(sel2[1].random_text).to.equal("wherever6");
    expect(sel2[2].random_text).to.equal("wherever4");
    const changed_made1 = await connection.update("something1", [["random_text","!=","wherever1"]], { random_text: "changed!" });
    const sel3 = await connection.select("something1", [["random_text","!=","wherever1"]]);
    expect(sel3[0].random_text).to.equal("changed!");
  });

  it("can use traits to expand the self API", async function() {
    this.timeout(10 * 1000);
    let flag = 0;
    expect(flag).to.equal(0);
    const trait_class_1 = class extends memofactory.basic_trait {
      constructor(memory) {
        super(memory);
      }
      trait_1_own_method() {
        return "yes";
      }
      async on_mount() {
        this.logger.trace("trait_class_1.on_mount", arguments);
        try {
          this.memory.hello_from_trait_1 = () => {
            return "hello!";
          };
          await new Promise((resolve, reject) => {
            flag = 1;
            setTimeout(() => resolve(), 100);
          });
        } catch (error) {
          this.logger.error("trait_class_1.on_mount", error, true);
        }
      }
      async on_mounted() {
        this.logger.trace("trait_class_1.on_mounted", arguments);
        try {
          await new Promise((resolve, reject) => {
            flag = 2;
            setTimeout(() => resolve(), 100);
          });
        } catch (error) {
          this.logger.error("trait_class_1.on_mounted", error, true);
        }
      }
      async on_unmount() {
        this.logger.trace("trait_class_1.on_unmount", arguments);
        try {
          await new Promise((resolve, reject) => {
            flag = 3;
            setTimeout(() => resolve(), 100);
          });
        } catch (error) {
          this.logger.error("trait_class_1.on_unmount", error, true);
        }
      }
      async on_unmounted() {
        this.logger.trace("trait_class_1.on_unmounted", arguments);
        try {
          delete this.memory.hello_from_trait_1;
          await new Promise((resolve, reject) => {
            flag = 4;
            setTimeout(() => resolve(), 100);
          });
        } catch (error) {
          this.logger.error("trait_class_1.on_unmounted", error, true);
        }
      }
    };
    expect(flag).to.equal(0);
    const connection = await memofactor.create_connection({ traits: { one: trait_class_1 } });
    expect(flag).to.equal(2);
    expect(typeof connection.memory.hello_from_trait_1).to.equal("function");
    expect(connection.memory.hello_from_trait_1()).to.equal("hello!");
    expect(connection.memory.traits.one.trait_1_own_method()).to.equal("yes");
    await connection.memory.unmount_traits(["one"]);
    expect(typeof connection.memory.hello_from_trait_1).to.equal("undefined");
    expect(flag).to.equal(4);
  });
  
  it("can use basic socket API", async function() {
    const connection = await memofactor.create_connection();
    
  });

});