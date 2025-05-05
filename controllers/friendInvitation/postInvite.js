const User = require('../../models/User.model');
const FriendInvitation = require('../../models/friendInvitation');
const friendsUpdates = require('../../socketHandlers/updates/friends');
const logger = require('../../logger');

const postInvite = async (req, res) => {
  try {
    const { targetMailAddress } = req.body;

    const { _id: userId, email } = req.user;

    logger.info(
      `Próba wysłania zaproszenia od ${userId} do użytkownika z mailem ${targetMailAddress}`,
    );

    console.log('userId', userId);

    console.log(`target:${targetMailAddress} mail: ${email}`);
    // check if friend that we would like to invite is not user

    if (email?.toLowerCase() === targetMailAddress?.toLowerCase()) {
      logger.warn(`Użytkownik ${userId} próbował zaprosić samego siebie`);
      return res
        .status(409)
        .send('Sorry. You cannot become friend with yourself');
    }

    const targetUser = await User.findOne({
      email: targetMailAddress.toLowerCase(),
    });

    if (!targetUser) {
      logger.warn(`Nie znaleziono użytkownika z mailem ${targetMailAddress}`);
      return res
        .status(404)
        .send(
          `Friend of ${targetMailAddress} has not been found. Please check mail address.`,
        );
    }

    // check if invitation has been already sent
    const invitationAlreadyReceived = await FriendInvitation.findOne({
      senderId: userId,
      receiverId: targetUser._id,
    });

    if (invitationAlreadyReceived) {
      logger.warn(`Zaproszenie od ${userId} do ${targetUser._id} już istnieje`);
      return res.status(409).send('Invitation has been already sent');
    }

    // check if the user which we would like to invite is already our friend
    const usersAlreadyFriends = targetUser.friends.find(
      (friendId) => friendId.toString() === userId.toString(),
    );

    if (usersAlreadyFriends) {
      logger.warn(`Użytkownicy ${userId} i ${targetUser._id} są już znajomymi`);
      return res
        .status(409)
        .send('Friend already added. Please check friends list');
    }

    // create new invitation in database
    const newInvitation = await FriendInvitation.create({
      senderId: userId,
      receiverId: targetUser._id,
    });

    // Aktualizuj pole requests w modelu użytkownika (synchronizacja między systemami)
    // Dodaj do listy requestów osoby otrzymującej zaproszenie
    await targetUser.updateOne({
      $push: { requests: userId },
    });

    // Dodaj do followings osoby wysyłającej zaproszenie
    const senderUser = await User.findById(userId);
    await senderUser.updateOne({
      $push: { following: targetUser._id },
    });

    // Dodaj do followers osoby otrzymującej zaproszenie
    await targetUser.updateOne({
      $push: { followers: userId },
    });

    // send pending invitations update to specific user
    if (friendsUpdates.updateFriendsPendingInvitations) {
      friendsUpdates.updateFriendsPendingInvitations(targetUser._id.toString());
    }

    logger.info(`Zaproszenie wysłane od ${userId} do ${targetUser._id}`);
    return res.status(201).send('Invitation has been sent');
  } catch (error) {
    logger.error(`Błąd podczas wysyłania zaproszenia: ${error.message}`);
    return res.status(500).send('Something went wrong. Please try again');
  }
};

module.exports = postInvite;
