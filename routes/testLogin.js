const express = require('express');
const User = require('../models/User.model');
const argon2 = require('argon2');
const { generateToken } = require('../helpers/tokens');
const logger = require('../logger');

const router = express.Router();

router.post('/testLogin', async (req, res) => {
  try {
    // Pełny log danych wejściowych
    logger.info(`Test login attempt - full body: ${JSON.stringify(req.body)}`);

    const { email, password } = req.body;

    if (!email || !password) {
      logger.warn('Login failed - missing email or password');
      return res.status(400).json({
        message: 'Email i hasło są wymagane',
      });
    }

    // Znajdź użytkownika po emailu
    const user = await User.findOne({ email });

    // Jeśli użytkownik nie istnieje
    if (!user) {
      logger.warn(`User with email ${email} not found`);
      return res.status(400).json({
        message: 'Nie znaleziono użytkownika z tym adresem email',
      });
    }

    logger.info(`User found with id: ${user._id}`);

    // Weryfikacja hasła
    try {
      const isValid = await argon2.verify(user.password, password);

      if (!isValid) {
        logger.warn(`Invalid password for user ${email}`);
        return res.status(400).json({
          message: 'Nieprawidłowe hasło',
        });
      }

      logger.info('Password verified successfully');
    } catch (err) {
      logger.error(`Error verifying password: ${err.message}`);
      return res.status(500).json({
        message: 'Wystąpił problem podczas weryfikacji hasła',
      });
    }

    // Generowanie tokenu JWT
    const token = generateToken({ id: user._id.toString() }, '7d');
    logger.info('JWT token generated successfully');

    // Zwrócenie danych użytkownika
    logger.info(`User ${email} successfully logged in`);
    res.status(200).json({
      id: user._id,
      username: user.username,
      picture: user.picture,
      first_name: user.first_name,
      last_name: user.last_name,
      token,
      verified: user.verified,
    });
  } catch (error) {
    logger.error(`Test login error: ${error.message}`);
    logger.error(error.stack);
    res.status(500).json({
      message: `Błąd serwera: ${error.message}`,
    });
  }
});

module.exports = router;
