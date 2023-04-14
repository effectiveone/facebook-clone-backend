const { expect } = require("chai");
const {
  addNewConnectedUser,
  removeConnectedUser,
  getActiveConnections,
  setSocketServerInstance,
  getSocketServerInstance,
  getOnlineUsers,
  addNewActiveRoom,
  getActiveRooms,
  getActiveRoom,
  joinActiveRoom,
  leaveActiveRoom,
} = require("../serverStore");

describe("Server Store", () => {
  it("should add and remove connected users", () => {
    const socketId = "socket-id";
    const userId = "user-id";

    addNewConnectedUser({ socketId, userId });

    const onlineUsers = getOnlineUsers();
    expect(onlineUsers).to.deep.equal([{ socketId, userId }]);

    removeConnectedUser(socketId);

    const updatedOnlineUsers = getOnlineUsers();
    expect(updatedOnlineUsers).to.deep.equal([]);
  });

  it("should manage active rooms", () => {
    const socketId = "socket-id";
    const userId = "user-id";

    const newRoom = addNewActiveRoom(userId, socketId);
    expect(newRoom).to.have.property("roomId");
    expect(newRoom.participants).to.deep.equal([{ userId, socketId }]);

    const activeRooms = getActiveRooms();
    expect(activeRooms).to.deep.equal([newRoom]);

    const retrievedRoom = getActiveRoom(newRoom.roomId);
    expect(retrievedRoom).to.deep.equal(newRoom);

    const newParticipant = {
      userId: "another-user-id",
      socketId: "another-socket-id",
    };
    joinActiveRoom(newRoom.roomId, newParticipant);

    const updatedRoom = getActiveRoom(newRoom.roomId);
    expect(updatedRoom.participants).to.deep.equal([
      newRoom.participants[0],
      newParticipant,
    ]);

    leaveActiveRoom(newRoom.roomId, newParticipant.socketId);

    const roomAfterLeaving = getActiveRoom(newRoom.roomId);
    expect(roomAfterLeaving.participants).to.deep.equal([
      newRoom.participants[0],
    ]);
  });
});
