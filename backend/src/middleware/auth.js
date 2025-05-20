const jwt = require("jsonwebtoken");

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    req.user = null;
    return next(); // let the route handle it
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch {
    req.user = null; // token was present but invalid
  }

  return next(); // always proceed to the route handler
}

module.exports = authMiddleware;
