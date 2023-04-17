const Conversation = require("../models/conversation.model");
const chatUpdates = require("./updates/chat");

const directChatHistoryHandler = async (socket, data) => {
  try {
    const userId = socket.user;
    const { receiverUserId } = data;
    const conversation = await Conversation.findOne({
      participants: { $all: [userId.id, receiverUserId] },
      type: "DIRECT",
    });

    if (conversation) {
      chatUpdates.updateChatHistory(conversation._id.toString(), socket.id);
    }
  } catch (err) {
    console.log(err);
  }
};

module.exports = directChatHistoryHandler;
