const FriendInvitation = require('../../models/friendInvitation');
const User = require('../../models/User.model');
const friendsUpdates = require('../../socketHandlers/updates/friends');
const logger = require('../../logger');

const postAccept = async (req, res) => {
  try {
    const { id } = req.body;
    logger.info(`Próba akceptacji zaproszenia ${id}`);

    const invitation = await FriendInvitation.findById(id);

    if (!invitation) {
      logger.warn(`Nie znaleziono zaproszenia o ID ${id}`);
      return res.status(404).send('Zaproszenie nie zostało znalezione');
    }

    const { senderId, receiverId } = invitation;

    // Sprawdź, czy zalogowany użytkownik jest odbiorcą zaproszenia
    if (req.user.id !== receiverId.toString()) {
      logger.warn(
        `Użytkownik ${req.user.id} próbował zaakceptować zaproszenie ${id}, ale nie jest jego odbiorcą`,
      );
      return res
        .status(403)
        .send('Nie masz uprawnień do zaakceptowania tego zaproszenia');
    }

    // Pobierz obiekty użytkowników
    const senderUser = await User.findById(senderId);
    const receiverUser = await User.findById(receiverId);

    if (!senderUser || !receiverUser) {
      logger.warn(
        `Nie znaleziono użytkownika: sender: ${senderId}, receiver: ${receiverId}`,
      );
      return res.status(404).send('Nie znaleziono użytkownika');
    }

    // Dodaj znajomych do obu użytkowników
    if (!senderUser.friends.includes(receiverId)) {
      senderUser.friends.push(receiverId);
    }

    if (!receiverUser.friends.includes(senderId)) {
      receiverUser.friends.push(senderId);
    }

    // Usuń z listy requests odbiorcy
    receiverUser.requests = receiverUser.requests.filter(
      (id) => id.toString() !== senderId.toString(),
    );

    // Zapisz zmiany
    await senderUser.save();
    await receiverUser.save();

    // Usuń zaproszenie
    await FriendInvitation.findByIdAndDelete(invitation._id);

    // Aktualizuj listę znajomych, jeśli użytkownicy są online
    if (friendsUpdates.updateFriends) {
      friendsUpdates.updateFriends(senderId.toString());
      friendsUpdates.updateFriends(receiverId.toString());
    }

    // Aktualizuj listę oczekujących zaproszeń
    if (friendsUpdates.updateFriendsPendingInvitations) {
      friendsUpdates.updateFriendsPendingInvitations(receiverId.toString());
    }

    logger.info(`Zaproszenie ${id} zaakceptowane pomyślnie`);
    return res.status(200).send('Znajomy dodany pomyślnie');
  } catch (err) {
    logger.error(`Błąd podczas akceptacji zaproszenia: ${err.message}`);
    return res.status(500).send('Coś poszło nie tak. Spróbuj ponownie');
  }
};

module.exports = postAccept;
