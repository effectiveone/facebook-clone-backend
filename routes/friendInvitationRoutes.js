const express = require("express");
const router = express.Router();
const Joi = require("joi");
const validator = require("express-joi-validation").createValidator({});
const { authUser } = require("../middlwares/auth");
const {
  postInvite,
  postAccept,
  postReject,
} = require("../controllers/friendInvitation/friendInvitationControllers");

const postFriendInvitationSchema = Joi.object({
  targetMailAddress: Joi.string().email(),
});

const inviteDecisionSchema = Joi.object({
  id: Joi.string().required(),
});

router.post(
  "/invite",
  authUser,
  validator.body(postFriendInvitationSchema),
  postInvite
);

router.post(
  "/accept",
  authUser,
  validator.body(inviteDecisionSchema),
  postAccept
);

router.post(
  "/reject",
  authUser,
  validator.body(inviteDecisionSchema),
  postReject
);

module.exports = router;
