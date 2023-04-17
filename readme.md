<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Backend README</title>
</head>
<body>
<h1>Backend README</h1>

<p>This is the backend for the MERN stack (MongoDB, Express, React, and Node.js) application. This backend is built using Node.js and Express, and communicates with the frontend using Socket.io and RESTful API.</p>

<h2>Libraries</h2>

<p>The following libraries were used in this backend:</p>

<ul>
    <li><code>@hapi/joi</code>: Object schema validation for Node.js.</li>
    <li><code>bcrypt</code>: Password hashing and verification.</li>
    <li><code>celebrate</code>: Express middleware for celebrating (validating) requests.</li>
    <li><code>cloudinary</code>: Cloud-based image and video management platform.</li>
    <li><code>cors</code>: Cross-Origin Resource Sharing middleware for Express.</li>
    <li><code>dotenv</code>: Environment variable loader for Node.js.</li>
    <li><code>express</code>: Fast, unopinionated, minimalist web framework for Node.js.</li>
    <li><code>express-fileupload</code>: Middleware for handling file uploads in Express.</li>
    <li><code>express-joi-validation</code>: Joi validation middleware for Express.</li>
    <li><code>googleapis</code>: Client library for Google APIs.</li>
    <li><code>joi</code>: Object schema validation for JavaScript.</li>
    <li><code>jsonwebtoken</code>: JSON Web Token implementation for Node.js.</li>
    <li><code>mongodb</code>: MongoDB driver for Node.js.</li>
    <li><code>mongoose</code>: Elegant MongoDB object modeling for Node.js.</li>
    <li><code>nodemailer</code>: Send e-mails from Node.js.</li>
    <li><code>nodemon</code>: Monitor for any changes in your Node.js application and automatically restart the server.</li>
    <li><code>socket.io</code>: Real-time bidirectional event-based communication.</li>
    <li><code>supertest</code>: HTTP assertion library for testing Node.js applications.</li>
    <li><code>chai</code>: BDD/TDD assertion library for Node.js and browsers.</li>
    <li><code>chai-http</code>: HTTP integration testing with Chai assertions.</li>
    <li><code>mocha</code>: JavaScript testing framework for Node.js.</li>
    <li><code>socket.io-client</code>: Socket.io client for JavaScript.</li>
</ul>

<h2>Installation</h2>

<p>To install the dependencies for this backend, run the following command in your terminal:</p>

<pre><code>npm install</code></pre>

<h2>Starting the Server</h2>

<p>To start the server, run the following command in your terminal:</p>

<pre><code>npm start</code></pre>

<p>This will start the server on port 5000. You can access the API via <a href="http://localhost:5000">http://localhost:5000</a>.</p>

<h2>Testing</h2>

<p>To run the tests for this backend, run the following command in your terminal:</p>

<pre><code>npm test</code></pre>

<p>This will run the tests in the <code>tests/</code> directory.</p>
</body>
</html>
