const express = require('express');
const User = require('../models/User.model');
const argon2 = require('argon2');
const { generateToken } = require('../helpers/tokens');
const logger = require('../logger');

const router = express.Router();

router.post('/testRegister', async (req, res) => {
  try {
    // Pełny log danych wejściowych
    logger.info(
      `Test registration attempt - full body: ${JSON.stringify(req.body)}`,
    );

    const {
      first_name,
      last_name,
      email,
      password,
      bYear,
      bMonth,
      bDay,
      gender,
      username,
    } = req.body;

    // Walidacje
    if (!email || !password) {
      logger.warn('Registration failed - missing email or password');
      return res.status(400).json({
        message: 'Email i hasło są wymagane',
      });
    }

    // Sprawdź czy użytkownik z tym emailem już istnieje
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`Registration failed - email already exists: ${email}`);
      return res.status(400).json({
        message: 'Użytkownik z tym adresem email już istnieje',
      });
    }

    // Stwórz hash hasła
    const cryptedPassword = await argon2.hash(password);
    logger.info('Password hashed successfully');

    // Użyj podanej nazwy użytkownika lub stwórz unikalną
    const actualUsername =
      username ||
      `${first_name}${last_name}${Math.floor(Math.random() * 1000)}`;

    logger.info(`Creating user with username: ${actualUsername}`);

    // Stwórz nowego użytkownika
    const newUser = new User({
      first_name: first_name || 'Test',
      last_name: last_name || 'User',
      email,
      password: cryptedPassword,
      username: actualUsername,
      bYear: bYear || 2000,
      bMonth: bMonth || 1,
      bDay: bDay || 1,
      gender: gender || 'male',
      verified: true, // Ustawiam od razu na verified dla testów
    });

    // Zapisz użytkownika
    const savedUser = await newUser.save();
    logger.info(`User saved successfully with id: ${savedUser._id}`);

    // Wygeneruj token JWT
    const token = generateToken({ id: savedUser._id.toString() }, '7d');
    logger.info('Token generated successfully');

    // Zwróć odpowiedź
    logger.info('Registration completed successfully');
    res.status(200).json({
      id: savedUser._id,
      username: savedUser.username,
      picture: savedUser.picture,
      first_name: savedUser.first_name,
      last_name: savedUser.last_name,
      token,
      verified: savedUser.verified,
      message: 'Rejestracja zakończona pomyślnie!',
    });
  } catch (error) {
    logger.error(`Test registration error: ${error.message}`);
    logger.error(error.stack);
    res.status(500).json({
      message: `Błąd serwera: ${error.message}`,
    });
  }
});

module.exports = router;
