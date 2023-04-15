const jwt = require("jsonwebtoken");
const User = require("../models/User.model");

exports.authUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log("Brak nagłówka autoryzacji");
      return res.status(401).json({ message: "Brak nagłówka autoryzacji" });
    }

    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      console.log("Nieprawidłowy token autoryzacji");

      return res
        .status(401)
        .json({ message: "Nieprawidłowy token autoryzacji" });
    }

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    const user = await User.findById(decoded.id);

    if (!user) {
      console.log("Nieprawidłowa autentykacja");
      return res.status(401).json({ message: "Nieprawidłowa autentykacja" });
    }
    // console.log(`przeszlo  auth ${user._id}`);
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
