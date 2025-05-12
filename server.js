const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const { readdirSync } = require('fs');
const socketServer = require('./socketServer');
const friendInvitationRoutes = require('./routes/friendInvitationRoutes');
const testRegisterRoutes = require('./routes/testRegister');
const testLoginRoutes = require('./routes/testLogin');
const { config } = require('./config');
const logger = require('./logger');

const app = express();

// CORS - najprostsza możliwa konfiguracja - zezwala na wszystko
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://dapper-meerkat-651fdc.netlify.app',
  ],
  credentials: true,
}));

app.use(express.json());
app.use(
  fileUpload({
    useTempFiles: true,
  }),
);

// Load routes
readdirSync('./routes')
  .filter(
    (file) =>
      file !== 'friendInvitationRoutes.js' &&
      file !== 'testRegister.js' &&
      file !== 'testLogin.js' &&
      file !== 'story.js',
  )
  .forEach((file) => {
    app.use('/', require('./routes/' + file));
  });

// Prosty endpoint zdrowia
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Endpoint diagnostyczny
app.get('/api/diagnostics', (req, res) => {
  const diagnosticData = {
    server: {
      environment: config.environment,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      port: config.port,
    },
    database: {
      status:
        mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      url: config.dbUrl.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'), // Ukrywamy dane uwierzytelniające
    },
    cors: {
      mode: 'Open CORS - accepting all origins',
    },
  };
  res.status(200).json(diagnosticData);
});

// Specjalny endpoint dla tokenu demonstracyjnego
app.get('/demo-token', (req, res) => {
  try {
    const { generateToken } = require('./helpers/tokens');

    // Tworzenie tokenu demonstracyjnego
    const demoToken = generateToken({ id: 'demo-user-id' }, '1d');

    res.status(200).json({
      token: demoToken,
      user: {
        id: 'demo-user-id',
        username: 'demo_user',
        first_name: 'Demo',
        last_name: 'User',
        picture: 'https://i.pravatar.cc/150?img=57',
        verified: true,
      },
      message: 'Token demonstracyjny utworzony pomyślnie',
    });
  } catch (error) {
    logger.error(`Error generating demo token: ${error.message}`);
    res
      .status(500)
      .json({ message: `Błąd tworzenia tokenu: ${error.message}` });
  }
});

// Register story routes under /api to match frontend configuration
app.use('/api/story', require('./routes/story'));
app.use('/api/friend-invitation', friendInvitationRoutes);
app.use('/', testRegisterRoutes);
app.use('/', testLoginRoutes);

// Create HTTP server
const server = http.createServer(app);
socketServer.registerSocketServer(server);

// Connect to database
mongoose.set('strictQuery', true);

// Dodanie logowania dla diagnostyki MongoDB
mongoose.connection.on('connecting', () => {
  logger.info('Próba połączenia z MongoDB...');
});

mongoose.connection.on('connected', () => {
  logger.info('Połączono z MongoDB');
});

mongoose.connection.on('disconnected', () => {
  logger.warn('Rozłączono z MongoDB');
});

mongoose.connection.on('error', (err) => {
  logger.error(`Błąd połączenia MongoDB: ${err.message}`);
});

mongoose
  .connect(config.dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000, // Zwiększenie timeoutu do 30 sekund
    socketTimeoutMS: 45000, // Zwiększenie timeoutu socketa do 45 sekund
    connectTimeoutMS: 30000, // Zwiększenie timeoutu połączenia do 30 sekund
    heartbeatFrequencyMS: 10000, // Częstotliwość sprawdzania połączenia
    maxPoolSize: 10, // Maksymalna liczba połączeń w puli
    minPoolSize: 2, // Minimalna liczba połączeń w puli
  })
  .then(() => {
    logger.info(
      `Database connected successfully to ${config.environment} environment`,
    );
  })
  .catch((err) => {
    logger.error(`Error connecting to MongoDB: ${err.message}`);
    logger.error(err.stack);

    // Nie kończymy procesu - próbujemy kontynuować
    logger.info('Continuing despite database connection error');
  });

// Start server
server.listen(config.port, () => {
  logger.info(
    `Server is running on port ${config.port} in ${config.environment} environment`,
  );
});
