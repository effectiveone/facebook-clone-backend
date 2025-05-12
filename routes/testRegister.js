const express = require('express');
const { generateToken } = require('../helpers/tokens');
const logger = require('../logger');

const router = express.Router();

// Uproszczona obsługa wszystkich metod dla /testRegister
router.all('/testRegister', async (req, res) => {
  // Preflight request
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  // GET request - sprawdzenie dostępności
  if (req.method === 'GET') {
    return res
      .status(200)
      .json({ message: 'TestRegister endpoint jest dostępny' });
  }

  // POST request - właściwa rejestracja
  if (req.method === 'POST') {
    try {
      // Wymuś tryb demo dla wszystkich rejestracji
      logger.info(
        'Using forced DEMO mode for registration due to database issues',
      );

      // Próbuj odczytać dane z body
      let userData = {
        first_name: 'Demo',
        last_name: 'User',
        email: 'demo@example.com',
        username: `demo_${Date.now().toString().slice(-6)}`,
      };

      try {
        if (req.body) {
          if (req.body.first_name) userData.first_name = req.body.first_name;
          if (req.body.last_name) userData.last_name = req.body.last_name;
          if (req.body.email) userData.email = req.body.email;
          if (req.body.username) userData.username = req.body.username;
        }
      } catch (e) {
        logger.error(`Error parsing request body: ${e.message}`);
      }

      // Tworzenie unikalnego ID
      const userId = `demo_${Date.now()}`;

      // Generowanie tokenu
      const token = generateToken({ id: userId }, '7d');
      logger.info('Demo token generated successfully');

      // Zwróć odpowiedź
      logger.info('Demo registration completed successfully');
      return res.status(200).json({
        id: userId,
        username: userData.username,
        picture: 'https://i.pravatar.cc/150?img=36',
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        token,
        verified: true,
        message: 'Rejestracja w trybie demonstracyjnym zakończona pomyślnie!',
      });
    } catch (error) {
      logger.error(`Registration error: ${error.message}`);
      logger.error(error.stack);

      // Nawet w przypadku błędu zwróć dane demonstracyjne
      const token = generateToken({ id: 'error_fallback' }, '7d');
      return res.status(200).json({
        id: 'error_fallback',
        username: 'error_user',
        picture: 'https://i.pravatar.cc/150?img=36',
        first_name: 'Error',
        last_name: 'Recovery',
        email: 'error@example.com',
        token,
        verified: true,
        message: 'Rejestracja awaryjnie zakończona po błędzie',
      });
    }
  }

  // Inne metody - nie obsługiwane
  return res.status(405).json({ message: 'Metoda nie obsługiwana' });
});

module.exports = router;
