const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error("JWT_SECRET must be configured in the environment");
}

function readToken(req) {
    const cookies = req.headers.cookie || "";
    const tokenCookie = cookies
        .split(";")
        .map(cookie => cookie.trim())
        .find(cookie => cookie.startsWith("configflow_token="));

    return tokenCookie
        ? decodeURIComponent(tokenCookie.split("=").slice(1).join("="))
        : null;
}

function requireAuth(req, res, next) {
    const token = readToken(req);

    if (!token) {
        return res.status(401).json({
            success: false,
            message: "Authentication required"
        });
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET);
        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            message: "Your session has expired. Please log in again."
        });
    }
}

module.exports = {
    JWT_SECRET,
    requireAuth
};
