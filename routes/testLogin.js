const express = require('express');
const { generateToken } = require('../helpers/tokens');
const logger = require('../logger');

const router = express.Router();

// Specjalny tryb testowy - konto demonstracyjne
const DEMO_USER = {
  _id: 'demo123456789',
  username: 'demo_user',
  picture: 'https://i.pravatar.cc/150?img=68',
  first_name: 'Użytkownik',
  last_name: 'Demonstracyjny',
  email: 'demo@example.com',
  verified: true,
};

// Uproszczona obsługa wszystkich metod dla /testLogin
router.all('/testLogin', async (req, res) => {
  // Preflight request
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  // GET request - sprawdzenie dostępności
  if (req.method === 'GET') {
    return res
      .status(200)
      .json({ message: 'TestLogin endpoint jest dostępny' });
  }

  // POST request - właściwe logowanie
  if (req.method === 'POST') {
    try {
      // Zawsze używaj trybu demo z powodu problemów z bazą danych
      logger.info('Always using DEMO mode for login due to database issues');

      let email = 'demo@example.com';
      try {
        if (req.body && req.body.email) {
          email = req.body.email;
        }
      } catch (e) {
        logger.error(`Error reading request body: ${e.message}`);
      }

      const userId = `demo_${Date.now()}`;
      const token = generateToken({ id: userId }, '7d');

      return res.status(200).json({
        id: userId,
        username: `user_${Date.now().toString().slice(-6)}`,
        picture: 'https://i.pravatar.cc/150?img=68',
        first_name: 'Użytkownik',
        last_name: 'Demonstracyjny',
        email: email,
        token,
        verified: true,
        message: 'Zalogowano w trybie demonstracyjnym (wymuszonym)',
      });
    } catch (error) {
      logger.error(`Test login error: ${error.message}`);
      logger.error(error.stack);

      // Nawet w przypadku błędu zwróć dane demonstracyjne
      const token = generateToken({ id: 'error_fallback' }, '7d');
      return res.status(200).json({
        id: 'error_fallback',
        username: 'error_user',
        picture: 'https://i.pravatar.cc/150?img=68',
        first_name: 'Error',
        last_name: 'Recovery',
        email: 'error@example.com',
        token,
        verified: true,
        message: 'Zalogowano awaryjnie po błędzie',
      });
    }
  }

  // Inne metody - nie obsługiwane
  return res.status(405).json({ message: 'Metoda nie obsługiwana' });
});

module.exports = router;
