const {
  validateEmail,
  validateLength,
  validateUsername,
} = require('../helpers/validation');
const User = require('../models/User.model');
const Code = require('../models/Code');
const jwt = require('jsonwebtoken');
const argon2 = require('argon2');
const { generateToken } = require('../helpers/tokens');
const { sendVerificationEmail, sendResetCode } = require('../helpers/mailer');
const generateCode = require('../helpers/generateCode');
const mongoose = require('mongoose');

const logger = require('../logger');

exports.register = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      email,
      password,
      username,
      birthYear,
      birthMonth,
      birthDay,
      gender,
    } = req.body;

    if (!validateEmail(email)) {
      logger.error(`Invalid email address: ${email}`);
      return res.status(400).json({
        message: 'Invalid email address',
      });
    }

    const checkUser = await User.findOne({ email });
    if (checkUser) {
      logger.warn(`User with email ${email} already exists.`);
      return res.status(400).json({
        message:
          'This email address already exists, try with a different email address',
      });
    }

    if (!validateLength(firstName, 3, 30)) {
      logger.error(`Invalid first name: ${firstName}`);
      return res.status(400).json({
        message: 'First name must be between 3 and 30 characters',
      });
    }

    if (!validateLength(lastName, 3, 30)) {
      logger.error(`Invalid last name: ${lastName}`);
      return res.status(400).json({
        message: 'Last name must be between 3 and 30 characters',
      });
    }

    if (!validateLength(password, 6, 40)) {
      logger.error(`Invalid password: ${password}`);
      return res.status(400).json({
        message: 'Password must be at least 6 characters long',
      });
    }

    const cryptedPassword = await argon2.hash(password, 12);

    let tempUsername = firstName + lastName;
    let newUsername = await validateUsername(tempUsername);
    const newUser = await new User({
      firstName,
      lastName,
      email,
      password: cryptedPassword,
      username: newUsername,
      birthYear,
      birthMonth,
      birthDay,
      gender,
    }).save();

    const emailVerificationToken = generateToken(
      { id: newUser._id.toString() },
      '30m',
    );
    const url = `${process.env.BASE_URL}/activate/${emailVerificationToken}`;
    sendVerificationEmail(newUser?.email, newUser?.firstName, url);

    const token = generateToken({ id: newUser?._id.toString() }, '7d');

    logger.info(`User ${newUser.username} registered successfully`);

    res.send({
      id: newUser._id,
      username: newUser.username,
      picture: newUser.picture,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      token,
      email: newUser.email,
      verified: newUser.verified,
      message: 'Registration successful! Please activate your email to start.',
    });
  } catch (error) {
    logger.error(`Error occurred during registration: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`User not found with email ${email}`);
      return res.status(400).json({
        message: 'The email address you entered is not connected to an account',
      });
    }

    const check = await argon2.verify(user.password, password);
    if (!check) {
      logger.warn(`Invalid login credentials for user ${user.username}`);
      return res.status(400).json({
        message: 'Invalid credentials. Please try again',
      });
    }

    const token = generateToken({ id: user._id.toString() }, '7d');

    logger.info(`User ${user.username} logged in successfully`);

    res.send({
      id: user._id,
      username: user.username,
      picture: user.picture,
      firstName: user.firstName,
      lastName: user.lastName,
      token,
      verified: user.verified,
    });
  } catch (error) {
    logger.error(`Error occurred during login: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

exports.sendPasswordResetCode = async (req, res) => {
  try {
    const { emailAddress } = req.body;
    const user = await User.findOne({ emailAddress }).select('-password');
    await VerificationCode.findOneAndRemove({ user: user._id });
    const code = generateCode(5);
    const savedCode = await new VerificationCode({
      code,
      user: user._id,
    }).save();
    sendResetCode(user.emailAddress, user.firstName, code);
    logger.info(
      `Password reset code sent successfully to user ${user.username}`,
    );
    return res.status(200).json({
      message: 'Password reset code has been sent to your email',
    });
  } catch (error) {
    logger.error(
      `Error occurred while sending password reset code: ${error.message}`,
    );
    res.status(500).json({ message: error.message });
  }
};

exports.activateAccount = async (req, res) => {
  try {
    const validUserId = req.user.id;
    const { token } = req.body;
    const user = jwt.verify(token, process.env.TOKEN_SECRET);
    const checkUser = await User.findById(user.id);

    if (validUserId !== user.id) {
      logger.warn(
        `User ${validUserId} does not have authorization to activate account`,
      );
      return res.status(400).json({
        message: "You don't have the authorization to complete this operation.",
      });
    }

    if (checkUser.verified) {
      logger.warn(
        `User ${checkUser.username} tried to activate an already activated account`,
      );
      return res
        .status(400)
        .json({ message: 'This email is already activated.' });
    } else {
      await User.findByIdAndUpdate(user.id, { verified: true });
      logger.info(
        `User ${checkUser.username} has successfully activated their account`,
      );
      return res
        .status(200)
        .json({ message: 'Account has been activated successfully.' });
    }
  } catch (error) {
    logger.error(`Error occurred while activating account: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

exports.sendEmailVerification = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (user.verified === true) {
      logger.warn(
        `User ${user.username} tried to send verification email for an already activated account`,
      );
      return res.status(400).json({
        message: 'This account is already activated.',
      });
    }
    const emailVerificationToken = generateToken(
      { id: user._id.toString() },
      '30m',
    );
    const verificationUrl = `${process.env.BASE_URL}/activate/${emailVerificationToken}`;
    sendVerificationEmail(user.emailAddress, user.firstName, verificationUrl);
    logger.info(
      `Verification email sent successfully to user ${user.username}`,
    );
    return res.status(200).json({
      message: 'Email verification link has been sent to your email.',
    });
  } catch (error) {
    logger.error(
      `Error occurred while sending email verification: ${error.message}`,
    );
    res.status(500).json({ message: error.message });
  }
};

exports.findUserByEmail = async (req, res) => {
  try {
    const { emailAddress } = req.body;
    const user = await User.findOne({ emailAddress }).select('-password');
    if (!user) {
      logger.warn(`User not found with email address ${emailAddress}`);
      return res.status(400).json({
        message: 'Account does not exist.',
      });
    }
    logger.info(`User ${user.username} found by email address`);
    return res.status(200).json({
      emailAddress: user.emailAddress,
      picture: user.picture,
    });
  } catch (error) {
    logger.error(
      `Error occurred while finding user by email: ${error.message}`,
    );
    res.status(500).json({ message: error.message });
  }
};

exports.validateResetCode = async (req, res) => {
  try {
    const { emailAddress, code } = req.body;
    const user = await User.findOne({ emailAddress });
    const codeFromDb = await Code.findOne({ user: user._id });
    if (codeFromDb.code !== code) {
      logger.warn(`User ${user.username} provided incorrect reset code`);
      return res.status(400).json({
        message: 'Verification code is wrong..',
      });
    }
    logger.info(`User ${user.username} validated reset code successfully`);
    return res.status(200).json({ message: 'ok' });
  } catch (error) {
    logger.error(
      `Error occurred while validating reset code: ${error.message}`,
    );
    res.status(500).json({ message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  const { emailAddress, password } = req.body;

  const cryptedPassword = await argon2.hash(password, 12);
  await User.findOneAndUpdate(
    { emailAddress },
    {
      password: cryptedPassword,
    },
  );
  logger.info(
    `Password changed successfully for user with email address ${emailAddress}`,
  );
  return res.status(200).json({ message: 'ok' });
};
