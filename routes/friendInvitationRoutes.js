const express = require('express');
const router = express.Router();
const Joi = require('joi');
const validator = require('express-joi-validation').createValidator({});
const { authUser } = require('../middlwares/auth');
const {
  postInvite,
  postAccept,
  postReject,
} = require('../controllers/friendInvitation/friendInvitationControllers');
const FriendInvitation = require('../models/friendInvitation');
const logger = require('../logger');

const postFriendInvitationSchema = Joi.object({
  targetMailAddress: Joi.string().email().required(),
});

const inviteDecisionSchema = Joi.object({
  id: Joi.string(),
  senderId: Joi.string(),
  receiverId: Joi.string(),
}).or('id', 'senderId', 'receiverId');

// Wyślij zaproszenie do znajomego używając adresu email
router.post(
  '/invite',
  authUser,
  validator.body(postFriendInvitationSchema),
  postInvite,
);

// Zaakceptuj zaproszenie do znajomego
router.post(
  '/accept',
  authUser,
  validator.body(inviteDecisionSchema),
  postAccept,
);

// Odrzuć zaproszenie do znajomego
router.post(
  '/reject',
  authUser,
  validator.body(inviteDecisionSchema),
  postReject,
);

// Pobierz listę oczekujących zaproszeń (otrzymanych)
router.get('/pending', authUser, async (req, res) => {
  try {
    const pendingInvitations = await FriendInvitation.find({
      receiverId: req.user._id,
    }).populate('senderId', 'first_name last_name picture username email');

    logger.info(
      `Pobrano ${pendingInvitations.length} oczekujących zaproszeń dla użytkownika ${req.user._id}`,
    );
    res.json(pendingInvitations);
  } catch (error) {
    logger.error(`Błąd podczas pobierania zaproszeń: ${error.message}`);
    res.status(500).json({ message: 'Coś poszło nie tak. Spróbuj ponownie.' });
  }
});

// Pobierz listę wysłanych zaproszeń
router.get('/sent', authUser, async (req, res) => {
  try {
    const sentInvitations = await FriendInvitation.find({
      senderId: req.user._id,
    }).populate('receiverId', 'first_name last_name picture username email');

    logger.info(
      `Pobrano ${sentInvitations.length} wysłanych zaproszeń od użytkownika ${req.user._id}`,
    );
    res.json(sentInvitations);
  } catch (error) {
    logger.error(
      `Błąd podczas pobierania wysłanych zaproszeń: ${error.message}`,
    );
    res.status(500).json({ message: 'Coś poszło nie tak. Spróbuj ponownie.' });
  }
});

module.exports = router;
