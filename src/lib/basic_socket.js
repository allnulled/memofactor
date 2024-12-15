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