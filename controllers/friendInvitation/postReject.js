const FriendInvitation = require('../../models/friendInvitation');
const logger = require('../../logger');
const friendsUpdates = require('../../socketHandlers/updates/friends');

const postReject = async (req, res) => {
  try {
    const { id, senderId, receiverId } = req.body;
    logger.info(
      `Próba odrzucenia zaproszenia z danymi: ${JSON.stringify(req.body)}`,
    );

    let invitation;

    // Znajdź zaproszenie na podstawie dostarczonego ID lub pary senderId/receiverId
    if (id) {
      invitation = await FriendInvitation.findById(id);

      if (!invitation) {
        logger.warn(`Nie znaleziono zaproszenia o ID ${id}`);
        return res.status(404).send('Zaproszenie nie zostało znalezione');
      }
    } else if (senderId && receiverId) {
      invitation = await FriendInvitation.findOne({
        senderId: senderId,
        receiverId: receiverId,
      });

      if (!invitation) {
        logger.warn(
          `Nie znaleziono zaproszenia dla senderId: ${senderId}, receiverId: ${receiverId}`,
        );

        // Sprawdźmy, czy zaproszenie istnieje w odwrotnym kierunku
        invitation = await FriendInvitation.findOne({
          senderId: receiverId,
          receiverId: senderId,
        });

        if (!invitation) {
          return res.status(404).send('Zaproszenie nie zostało znalezione');
        }
      }
    } else {
      logger.warn(
        'Niepoprawny format danych - wymagane id lub para senderId/receiverId',
      );
      return res.status(400).send('Niepoprawny format danych');
    }

    // Sprawdź, czy zalogowany użytkownik jest odbiorcą zaproszenia
    if (req.user._id.toString() !== invitation.receiverId.toString()) {
      logger.warn(
        `Użytkownik ${req.user._id} próbował odrzucić zaproszenie, ale nie jest jego odbiorcą`,
      );
      return res
        .status(403)
        .send('Nie masz uprawnień do odrzucenia tego zaproszenia');
    }

    // Usuń zaproszenie
    await FriendInvitation.findByIdAndDelete(invitation._id);

    // Aktualizuj listę oczekujących zaproszeń, jeśli użytkownik jest online
    if (friendsUpdates.updateFriendsPendingInvitations) {
      friendsUpdates.updateFriendsPendingInvitations(
        invitation.receiverId.toString(),
      );
    }

    logger.info(`Zaproszenie odrzucone pomyślnie`);
    return res.status(200).send('Zaproszenie odrzucone');
  } catch (err) {
    logger.error(`Błąd podczas odrzucania zaproszenia: ${err.message}`);
    return res.status(500).send('Coś poszło nie tak. Spróbuj ponownie');
  }
};

module.exports = postReject;
