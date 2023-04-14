const request = require("supertest");
const { describe, it } = require("mocha");
const { expect } = require("chai");

const http = require("http");
const { Server } = require("socket.io");
const { registerSocketServer } = require("../socketServer");
const assert = require("assert");
const ioClient = require("socket.io-client"); // Add this line

before(() => {
  // wykonaj akcje przed uruchomieniem testów
});

after(() => {
  // wykonaj akcje po uruchomieniu testów
});

describe("Test Suite", () => {
  it("Test Case 1", () => {
    assert.strictEqual(1 + 1, 2);
  });

  it("Test Case 2", () => {
    assert.strictEqual(2 * 3, 6);
  });
});

describe("socketServer", () => {
  let server;
  let io;
  before(() => {
    server = http.createServer();
    io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    registerSocketServer(server);
    server.listen(); // Add this line
  });

  after(() => {
    io.close();
    server.close();
  });

  it("should create new socket connection", async () => {
    const socket = ioClient(`http://localhost:${server.address().port}`, {
      // Update this line
      transports: ["websocket"],
    });
    socket.on("connect", () => {
      expect(socket.connected).toBeTruthy();
    });
    socket.disconnect();
  });

  it("should emit online users", async () => {
    const socket = ioClient(`http://localhost:${server.address().port}`, {
      // Update this line
      transports: ["websocket"],
    });
    socket.on("online-users", (data) => {
      expect(data).toBeDefined();
      expect(data.onlineUsers).toBeDefined();
      expect(data.onlineUsers).toEqual([]);
    });
    socket.disconnect();
  });

  it("should create new room", async () => {
    const socket = ioClient(`http://localhost:${server.address().port}`, {
      // Update this line
      transports: ["websocket"],
    });
    socket.emit("room-create");
    socket.on("room-created", (data) => {
      expect(data).toBeDefined();
      expect(data.roomId).toBeDefined();
      expect(typeof data.roomId).toBe("string");
    });
    socket.disconnect();
  });
});
