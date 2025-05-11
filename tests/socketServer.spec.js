const { expect } = require("chai");
const sinon = require("sinon");
const http = require("http");
const { Server } = require("socket.io");
const ioClient = require("socket.io-client");
const { registerSocketServer } = require("../socketServer");
const { addNewConnectedUser, getOnlineUsers } = require("../serverStore");

describe("socketServer", () => {
  let server;
  let io;
  let serverAddress;
  let clientSocket;
  let serverStore;

  // Setup test environment before each test
  beforeEach((done) => {
    // Create HTTP server and Socket.IO instance
    server = http.createServer();
    io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    });
    
    // Setup server and start listening
    registerSocketServer(server);
    server.listen(() => {
      serverAddress = server.address();
      done();
    });
  });

  // Cleanup after each test
  afterEach((done) => {
    if (clientSocket && clientSocket.connected) {
      clientSocket.disconnect();
    }
    io.close();
    server.close(done);
  });

  describe("Socket Connection", () => {
    it("should successfully connect to socket server", (done) => {
      clientSocket = ioClient(`http://localhost:${serverAddress.port}`, {
        transports: ["websocket"],
      });
      
      clientSocket.on("connect", () => {
        expect(clientSocket.connected).to.be.true;
        done();
      });
    });

    it("should receive online users event after connection", (done) => {
      // Arrange: Setup a spy for the event
      const onlineUsersSpy = sinon.spy();
      
      // Act: Connect to the socket server
      clientSocket = ioClient(`http://localhost:${serverAddress.port}`, {
        transports: ["websocket"],
      });
      
      // Assert: Verify the online-users event
      clientSocket.on("online-users", (data) => {
        onlineUsersSpy(data);
        expect(data).to.be.an("object");
        expect(data).to.have.property("onlineUsers");
        expect(data.onlineUsers).to.be.an("array");
        done();
      });
    });
  });

  describe("Room Management", () => {  
    it("should create a new room and emit room-created event", (done) => {
      clientSocket = ioClient(`http://localhost:${serverAddress.port}`, {
        transports: ["websocket"],
      });
      
      clientSocket.on("connect", () => {
        // Connect a user with a known ID
        clientSocket.emit("user-identity", { userId: "test-user-id" });
        
        // Create a room
        clientSocket.emit("room-create");
      });
      
      clientSocket.on("room-created", (data) => {
        expect(data).to.be.an("object");
        expect(data).to.have.property("roomId");
        expect(data.roomId).to.be.a("string");
        expect(data.roomId).to.have.length.greaterThan(0);
        done();
      });
    });
    
    it("should allow a user to join an existing room", (done) => {
      let roomId;
      
      // Create first client that will create the room
      const creator = ioClient(`http://localhost:${serverAddress.port}`, {
        transports: ["websocket"],
      });
      
      creator.on("connect", () => {
        creator.emit("user-identity", { userId: "creator-id" });
        creator.emit("room-create");
      });
      
      creator.on("room-created", (data) => {
        roomId = data.roomId;
        
        // Create second client that will join the room
        clientSocket = ioClient(`http://localhost:${serverAddress.port}`, {
          transports: ["websocket"],
        });
        
        clientSocket.on("connect", () => {
          clientSocket.emit("user-identity", { userId: "joiner-id" });
          clientSocket.emit("room-join", { roomId });
        });
      });
      
      creator.on("room-update", (data) => {
        expect(data).to.be.an("object");
        expect(data).to.have.property("participants");
        expect(data.participants).to.be.an("array");
        expect(data.participants.length).to.equal(2);
        
        // Cleanup
        creator.disconnect();
        done();
      });
    });
  });

  describe("Error Handling", () => {
    it("should handle room-join with invalid roomId", (done) => {
      clientSocket = ioClient(`http://localhost:${serverAddress.port}`, {
        transports: ["websocket"],
      });
      
      clientSocket.on("connect", () => {
        clientSocket.emit("user-identity", { userId: "test-user-id" });
        
        // Try to join a room with an invalid room ID
        clientSocket.emit("room-join", { roomId: "invalid-room-id" });
      });
      
      // No specific error event in the current implementation,
      // but we can verify no room-update event is triggered
      // and add a timeout to complete the test
      clientSocket.on("room-update", () => {
        // This should not be called with an invalid room ID
        expect.fail("Should not receive room-update for invalid room");
      });
      
      // Wait a reasonable time to ensure no update event is received
      setTimeout(done, 500);
    });
  });
});
