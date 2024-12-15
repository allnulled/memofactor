const trait_of_perception = class extends basic_trait {
  constructor(memory) {
    super(memory);
    this.logger = memory.logger;
    this.connection = memory.connection;
    this.reactrons = {};
  }
  percibe(perceptron) {
    // 1. match de reactrones
    // 2. ordenar reactrones
    // 3. hacer reaccionar reactrones
  }
  add(id, reactron) {
    
  }
  remove(id, reactron) {

  }
}