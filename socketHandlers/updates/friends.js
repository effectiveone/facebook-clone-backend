const User = require('../../models/User.model');
const FriendInvitation = require('../../models/friendInvitation');
const serverStore = require('../../serverStore');
const logger = require('../../logger');

const updateFriendsPendingInvitations = async (userId) => {
  try {
    // Pobierz oczekujące zaproszenia z kolekcji FriendInvitation
    const pendingInvitations = await FriendInvitation.find({
      receiverId: userId,
    }).populate('senderId', '_id username email first_name last_name picture');

    // Znajdź wszystkie aktywne połączenia dla danego użytkownika
    const receiverList = serverStore.getActiveConnections(userId);
    const io = serverStore.getSocketServerInstance();

    if (receiverList.length > 0) {
      logger.info(
        `Wysyłanie aktualizacji zaproszeń do użytkownika ${userId} przez ${receiverList.length} połączeń`,
      );

      receiverList.forEach((receiverSocketId) => {
        io.to(receiverSocketId).emit('friends-invitations', {
          pendingInvitations: pendingInvitations || [],
        });
      });
    }
  } catch (err) {
    logger.error(
      `Błąd podczas aktualizacji oczekujących zaproszeń: ${err.message}`,
    );
  }
};

const updateFriends = async (userId) => {
  try {
    // Znajdź aktywne połączenia dla danego użytkownika
    const receiverList = serverStore.getActiveConnections(userId);

    if (receiverList.length > 0) {
      // Pobierz użytkownika wraz z jego znajomymi
      const user = await User.findById(userId, { _id: 1, friends: 1 }).populate(
        'friends',
        '_id username email first_name last_name picture',
      );

      if (user) {
        const friendsList = user.friends.map((f) => {
          return {
            id: f._id,
            email: f.email,
            username: f.username,
            firstName: f.first_name,
            lastName: f.last_name,
            picture: f.picture,
          };
        });

        const io = serverStore.getSocketServerInstance();
        logger.info(
          `Wysyłanie aktualizacji listy znajomych (${friendsList.length}) do użytkownika ${userId}`,
        );

        receiverList.forEach((receiverSocketId) => {
          io.to(receiverSocketId).emit('friends-list', {
            friends: friendsList || [],
          });
        });
      }
    }
  } catch (err) {
    logger.error(`Błąd podczas aktualizacji listy znajomych: ${err.message}`);
  }
};

// Nowa funkcja do aktualizacji statusu zaproszenia
const updateInvitationStatus = async (userId, targetUserId, status) => {
  try {
    // Znajdź aktywne połączenia dla obu użytkowników
    const userConnections = serverStore.getActiveConnections(userId);
    const targetConnections = serverStore.getActiveConnections(targetUserId);

    const io = serverStore.getSocketServerInstance();

    // Informuj nadawcę o zmianie statusu
    if (userConnections.length > 0) {
      logger.info(
        `Informowanie użytkownika ${userId} o zmianie statusu zaproszenia: ${status}`,
      );

      userConnections.forEach((socketId) => {
        io.to(socketId).emit('invitation-status-changed', {
          targetUserId,
          status,
        });
      });
    }

    // Informuj odbiorcę o zmianie statusu
    if (targetConnections.length > 0) {
      logger.info(
        `Informowanie użytkownika ${targetUserId} o zmianie statusu zaproszenia: ${status}`,
      );

      targetConnections.forEach((socketId) => {
        io.to(socketId).emit('invitation-status-changed', {
          userId,
          status,
        });
      });
    }
  } catch (err) {
    logger.error(
      `Błąd podczas aktualizacji statusu zaproszenia: ${err.message}`,
    );
  }
};

module.exports = {
  updateFriendsPendingInvitations,
  updateFriends,
  updateInvitationStatus,
};
