const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/authMiddleware");

const login = (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], async (err, result) => {
        if (err) {
            return res.status(500).json(err);
        }

        if (result.length === 0) {
            return res.status(401).json({
                success: false,
                message: "Invalid Email or Password"
            });
        }

        const account = result[0];
        const isHash = /^\$2[aby]\$/.test(account.password);
        const validPassword = isHash
            ? await bcrypt.compare(password, account.password)
            : password === account.password;

        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: "Invalid Email or Password"
            });
        }

        if (!isHash) {
            const passwordHash = await bcrypt.hash(password, 12);
            db.query(
                "UPDATE users SET password=? WHERE id=?",
                [passwordHash, account.id]
            );
        }

        const { password: ignoredPassword, ...safeUser } = account;
        const token = jwt.sign(
            {
                id: account.id,
                email: account.email,
                role: account.role
            },
            JWT_SECRET,
            { expiresIn: "8h" }
        );

        res.setHeader(
            "Set-Cookie",
            `configflow_token=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Max-Age=28800; Path=/`
        );

        res.json({
            success: true,
            message: "Login Successful",
            user: safeUser
        });
    });
};

const logout = (req, res) => {
    res.setHeader(
        "Set-Cookie",
        "configflow_token=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/"
    );
    res.json({ success: true, message: "Logged out" });
};

const register = (req, res) => {
    const { name, email, employee_id, password } = req.body;

    if (!name || !email || !employee_id || !password) {
        return res.status(400).json({
            success: false,
            message: "Name, work email, employee ID, and password are required"
        });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const normalizedEmployeeId = employee_id.trim();

    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
        return res.status(400).json({
            success: false,
            message: "Enter a valid work email address"
        });
    }

    const role = normalizedEmail.endsWith("@dev.ac.in")
        ? "Developer"
        : normalizedEmail.endsWith("@manager.in")
            ? "Manager"
            : null;

    if (!role) {
        return res.status(400).json({
            success: false,
            message: "Use a @dev.ac.in email for Developer or @manager.in for Manager"
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            success: false,
            message: "Password must be at least 8 characters"
        });
    }

    const existingSql = `
        SELECT id
        FROM users
        WHERE email=? OR employee_id=?
    `;

    db.query(existingSql, [normalizedEmail, normalizedEmployeeId], (err, existingUsers) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Registration requires the employee ID database update"
            });
        }

        if (existingUsers.length) {
            return res.status(409).json({
                success: false,
                message: "Email or employee ID is already registered"
            });
        }

        const insertSql = `
            INSERT INTO users (name, email, employee_id, password, role)
            VALUES (?, ?, ?, ?, ?)
        `;

        bcrypt.hash(password, 12, (hashError, passwordHash) => {
            if (hashError) {
                console.error(hashError);
                return res.status(500).json({
                    success: false,
                    message: "Could not secure account password"
                });
            }

            db.query(
            insertSql,
            [name.trim(), normalizedEmail, normalizedEmployeeId, passwordHash, role],
            insertError => {
                if (insertError) {
                    console.error(insertError);
                    return res.status(500).json({
                        success: false,
                        message: "Could not create account"
                    });
                }

                res.status(201).json({
                    success: true,
                    message: `${role} account created. You can now log in.`
                });
            }
            );
        });
    });
};

module.exports = { login, register, logout };