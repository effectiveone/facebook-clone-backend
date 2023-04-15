const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

exports.authUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: "Brak nagłówka autoryzacji" });
    }

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res
        .status(401)
        .json({ message: "Nieprawidłowy token autoryzacji" });
    }

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ message: "Nieprawidłowa autentykacja" });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res
        .status(401)
        .json({ message: "Nieprawidłowy token autoryzacji" });
    }
    return res.status(500).json({ message: error.message });
  }
};
