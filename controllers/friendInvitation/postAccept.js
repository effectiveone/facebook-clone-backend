const FriendInvitation = require('../../models/friendInvitation');
const User = require('../../models/User.model');
const friendsUpdates = require('../../socketHandlers/updates/friends');
const logger = require('../../logger');

const postAccept = async (req, res) => {
  try {
    // Rozszerzone logowanie zawartości przychodzącego żądania
    // Formatowanie wiadomości dla Dockera (JSON dla łatwiejszego parsowania)
    const requestInfo = {
      timestamp: new Date().toISOString(),
      service: 'friend-service',
      event: 'request_received',
      method: req.method,
      url: req.originalUrl,
      headers: req.headers,
      body: req.body,
      params: req.params,
      query: req.query,
    };

    // Logowanie w formacie przyjaźnym dla Dockera (JSON)
    console.log(JSON.stringify(requestInfo));
    logger.info('===== ROZPOCZĘCIE PRZETWARZANIA ZAPROSZENIA =====');
    logger.info(`Metoda HTTP: ${req.method}, URL: ${req.originalUrl}`);
    logger.info(`Headers: ${JSON.stringify(req.headers)}`);
    logger.info(`Body (raw): ${JSON.stringify(req.body)}`);
    logger.info(`Params: ${JSON.stringify(req.params)}`);
    logger.info(`Query: ${JSON.stringify(req.query)}`);

    // Analiza przychodzących danych
    const { id, senderId, receiverId } = req.body;
    logger.info(
      `Parametry ekstrahowane z żądania - id: ${id || 'brak'}, senderId: ${
        senderId || 'brak'
      }, receiverId: ${receiverId || 'brak'}`,
    );

    logger.info(
      `Próba akceptacji zaproszenia z danymi: ${JSON.stringify(req.body)}`,
    );

    // Identyfikacja zalogowanego użytkownika
    logger.info(`Zalogowany użytkownik: ${req.user._id}`);

    let invitation;
    // Znajdź zaproszenie na podstawie dostarczonego ID lub pary senderId/receiverId
    if (id) {
      logger.info(`Wyszukiwanie zaproszenia po ID: ${id}`);
      invitation = await FriendInvitation.findById(id);
      if (!invitation) {
        logger.warn(`Nie znaleziono zaproszenia o ID ${id}`);
        return res.status(404).send('Zaproszenie nie zostało znalezione');
      }
      logger.info(
        `Znaleziono zaproszenie po ID: ${JSON.stringify(invitation)}`,
      );
    } else if (senderId && receiverId) {
      logger.info(
        `Wyszukiwanie zaproszenia po senderId: ${senderId}, receiverId: ${receiverId}`,
      );
      invitation = await FriendInvitation.findOne({
        senderId: senderId,
        receiverId: receiverId,
      });
      if (!invitation) {
        logger.warn(
          `Nie znaleziono zaproszenia dla senderId: ${senderId}, receiverId: ${receiverId}`,
        );
        // Sprawdźmy, czy zaproszenie istnieje w odwrotnym kierunku
        logger.info(
          `Sprawdzanie zaproszenia w odwrotnym kierunku - senderId: ${receiverId}, receiverId: ${senderId}`,
        );
        invitation = await FriendInvitation.findOne({
          senderId: receiverId,
          receiverId: senderId,
        });
        if (!invitation) {
          logger.warn('Nie znaleziono zaproszenia w żadnym kierunku');
          return res.status(404).send('Zaproszenie nie zostało znalezione');
        }
        logger.info(
          `Znaleziono zaproszenie w odwrotnym kierunku: ${JSON.stringify(
            invitation,
          )}`,
        );
      } else {
        logger.info(`Znaleziono zaproszenie: ${JSON.stringify(invitation)}`);
      }
    } else {
      logger.warn(
        'Niepoprawny format danych - wymagane id lub para senderId/receiverId',
      );
      logger.warn(`Otrzymane dane: ${JSON.stringify(req.body)}`);
      return res.status(400).send('Niepoprawny format danych');
    }

    // Pobierz senderId i receiverId z znalezionego zaproszenia
    const invitationSenderId = invitation.senderId;
    const invitationReceiverId = invitation.receiverId;
    logger.info(
      `Użyte wartości - senderId: ${invitationSenderId}, receiverId: ${invitationReceiverId}`,
    );

    // Sprawdź, czy zalogowany użytkownik jest odbiorcą zaproszenia
    logger.info(
      `Porównanie ID użytkownika (${req.user._id.toString()}) z ID odbiorcy (${invitationReceiverId.toString()})`,
    );
    if (req.user._id.toString() !== invitationReceiverId.toString()) {
      logger.warn(
        `Użytkownik ${req.user._id} próbował zaakceptować zaproszenie, ale nie jest jego odbiorcą`,
      );
      return res
        .status(403)
        .send('Nie masz uprawnień do zaakceptowania tego zaproszenia');
    }

    // Pobierz obiekty użytkowników
    logger.info(`Pobieranie danych użytkownika-nadawcy: ${invitationSenderId}`);
    const senderUser = await User.findById(invitationSenderId);
    logger.info(
      `Pobieranie danych użytkownika-odbiorcy: ${invitationReceiverId}`,
    );
    const receiverUser = await User.findById(invitationReceiverId);

    if (!senderUser) {
      logger.warn(
        `Nie znaleziono użytkownika-nadawcy o ID: ${invitationSenderId}`,
      );
      return res.status(404).send('Nie znaleziono użytkownika-nadawcy');
    }

    if (!receiverUser) {
      logger.warn(
        `Nie znaleziono użytkownika-odbiorcy o ID: ${invitationReceiverId}`,
      );
      return res.status(404).send('Nie znaleziono użytkownika-odbiorcy');
    }

    logger.info(`Dane użytkownika-nadawcy: ${JSON.stringify(senderUser)}`);
    logger.info(`Dane użytkownika-odbiorcy: ${JSON.stringify(receiverUser)}`);

    // Dodaj znajomych do obu użytkowników
    logger.info(
      `Sprawdzanie listy znajomych nadawcy przed aktualizacją: ${JSON.stringify(
        senderUser.friends,
      )}`,
    );
    if (!senderUser.friends.includes(invitationReceiverId)) {
      logger.info(
        `Dodawanie odbiorcy (${invitationReceiverId}) do listy znajomych nadawcy`,
      );
      senderUser.friends.push(invitationReceiverId);
    } else {
      logger.info(`Odbiorca już istnieje na liście znajomych nadawcy`);
    }

    logger.info(
      `Sprawdzanie listy znajomych odbiorcy przed aktualizacją: ${JSON.stringify(
        receiverUser.friends,
      )}`,
    );
    if (!receiverUser.friends.includes(invitationSenderId)) {
      logger.info(
        `Dodawanie nadawcy (${invitationSenderId}) do listy znajomych odbiorcy`,
      );
      receiverUser.friends.push(invitationSenderId);
    } else {
      logger.info(`Nadawca już istnieje na liście znajomych odbiorcy`);
    }

    // Usuń z listy requests odbiorcy
    logger.info(
      `Lista zaproszeń odbiorcy przed aktualizacją: ${JSON.stringify(
        receiverUser.requests,
      )}`,
    );
    receiverUser.requests = receiverUser.requests.filter(
      (id) => id.toString() !== invitationSenderId.toString(),
    );
    logger.info(
      `Lista zaproszeń odbiorcy po aktualizacji: ${JSON.stringify(
        receiverUser.requests,
      )}`,
    );

    // Zapisz zmiany
    logger.info('Zapisywanie zmian w dokumencie nadawcy');
    await senderUser.save();
    logger.info('Zapisywanie zmian w dokumencie odbiorcy');
    await receiverUser.save();

    // Usuń zaproszenie
    logger.info(`Usuwanie zaproszenia o ID: ${invitation._id}`);
    await FriendInvitation.findByIdAndDelete(invitation._id);

    // Aktualizuj listę znajomych, jeśli użytkownicy są online
    if (friendsUpdates.updateFriends) {
      logger.info(`Wywołanie updateFriends dla nadawcy: ${invitationSenderId}`);
      friendsUpdates.updateFriends(invitationSenderId.toString());
      logger.info(
        `Wywołanie updateFriends dla odbiorcy: ${invitationReceiverId}`,
      );
      friendsUpdates.updateFriends(invitationReceiverId.toString());
    } else {
      logger.warn('Funkcja updateFriends jest niedostępna');
    }

    // Aktualizuj listę oczekujących zaproszeń
    if (friendsUpdates.updateFriendsPendingInvitations) {
      logger.info(
        `Wywołanie updateFriendsPendingInvitations dla odbiorcy: ${invitationReceiverId}`,
      );
      friendsUpdates.updateFriendsPendingInvitations(
        invitationReceiverId.toString(),
      );
    } else {
      logger.warn('Funkcja updateFriendsPendingInvitations jest niedostępna');
    }

    logger.info('===== ZAKOŃCZENIE PRZETWARZANIA ZAPROSZENIA: SUKCES =====');
    return res.status(200).send('Znajomy dodany pomyślnie');
  } catch (err) {
    // Formatowanie błędu dla Dockera
    const errorInfo = {
      timestamp: new Date().toISOString(),
      service: 'friend-service',
      event: 'request_error',
      error_name: err.name,
      error_message: err.message,
      error_stack: err.stack,
      request_body: req.body,
      request_params: req.params,
    };

    // Logowanie błędu w formacie JSON dla Dockera
    console.error(JSON.stringify(errorInfo));

    logger.error(`===== BŁĄD PODCZAS PRZETWARZANIA ZAPROSZENIA =====`);
    logger.error(`Typ błędu: ${err.name}`);
    logger.error(`Wiadomość błędu: ${err.message}`);
    logger.error(`Stack śladu: ${err.stack}`);
    if (err.code) {
      logger.error(`Kod błędu: ${err.code}`);
    }

    // Szczegółowe informacje o żądaniu przy błędzie
    try {
      logger.error(
        `Dane żądania przy błędzie - Body: ${JSON.stringify(req.body)}`,
      );
      logger.error(
        `Dane żądania przy błędzie - Params: ${JSON.stringify(req.params)}`,
      );
      logger.error(
        `Dane żądania przy błędzie - Query: ${JSON.stringify(req.query)}`,
      );
      logger.error(
        `Dane żądania przy błędzie - Headers: ${JSON.stringify(req.headers)}`,
      );

      // Sprawdź typ błędu dla bardziej precyzyjnej obsługi
      if (err.name === 'ValidationError') {
        logger.error(`Błąd walidacji: ${JSON.stringify(err.errors)}`);
        return res.status(400).send('Nieprawidłowe dane wejściowe');
      } else if (err.name === 'CastError') {
        logger.error(`Błąd rzutowania: ${err.message}`);
        return res.status(400).send('Nieprawidłowy format ID');
      } else if (err.name === 'MongoError' && err.code === 11000) {
        logger.error(`Błąd duplikatu: ${err.message}`);
        return res.status(409).send('Rekord już istnieje');
      }
    } catch (logErr) {
      logger.error(`Błąd podczas logowania szczegółów: ${logErr.message}`);
    }

    logger.error('===== KONIEC BŁĘDU =====');
    return res.status(500).send('Coś poszło nie tak. Spróbuj ponownie');
  }
};

module.exports = postAccept;
