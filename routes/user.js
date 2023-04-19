const express = require("express");
const {
  register,
  activateAccount,
  login,
  sendEmailVerification,
  findUserByEmail,
  sendPasswordResetCode,
  validateResetCode,
  changePassword,
} = require("../controllers/userController");
const { authUser } = require("../middlwares/auth");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/activate", authUser, activateAccount);
router.post("/sendVerification", authUser, sendEmailVerification);
router.post("/findUser", findUserByEmail);
router.post("/sendResetPasswordCode", sendPasswordResetCode);
router.post("/validateResetCode", validateResetCode);
router.post("/changePassword", changePassword);

module.exports = router;
