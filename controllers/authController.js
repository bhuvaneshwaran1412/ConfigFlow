const db = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../middleware/authMiddleware");

const login = (req, res) => {
    const { email, password } = req.body;

    const sql = "SELECT * FROM users WHERE email = ?";

    db.query(sql, [email], async (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Unable to process login"
            });
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

const getEmployeeIdPreview = (req, res) => {
    db.query(
        `SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id, 5) AS UNSIGNED)), 0) + 1 AS next_number
         FROM users
         WHERE employee_id REGEXP '^CFG-[0-9]+$'`,
        (err, result) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ success: false, message: "Unable to generate employee ID preview" });
            }

            const nextNumber = Number(result[0].next_number);
            res.json({
                success: true,
                employee_id: `CFG-${String(nextNumber).padStart(4, "0")}`
            });
        }
    );
};

const register = (req, res) => {
    const { name, email, password, confirm_password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({
            success: false,
            message: "Name, work email, and password are required"
        });
    }

    if (confirm_password !== undefined && password !== confirm_password) {
        return res.status(400).json({ success: false, message: "Passwords do not match" });
    }

    const normalizedEmail = email.trim().toLowerCase();

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
        WHERE email=?
    `;

    db.query(existingSql, [normalizedEmail], (err, existingUsers) => {
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

            const insertWithGeneratedId = attempt => {
                db.query(
                    `SELECT COALESCE(MAX(CAST(SUBSTRING(employee_id, 5) AS UNSIGNED)), 0) + 1 AS next_number
                     FROM users
                     WHERE employee_id REGEXP '^CFG-[0-9]+$'`,
                    (sequenceError, sequenceResult) => {
                        if (sequenceError) {
                            console.error(sequenceError);
                            return res.status(500).json({ success: false, message: "Could not assign employee ID" });
                        }

                        const nextNumber = Number(sequenceResult[0].next_number);
                        const employeeId = `CFG-${String(nextNumber).padStart(4, "0")}`;
                        db.query(
                            insertSql,
                            [name.trim(), normalizedEmail, employeeId, passwordHash, role],
                            insertError => {
                                if (insertError && insertError.code === "ER_DUP_ENTRY" && attempt < 5) {
                                    return insertWithGeneratedId(attempt + 1);
                                }
                                if (insertError) {
                                    console.error(insertError);
                                    return res.status(500).json({ success: false, message: "Could not create account" });
                                }

                                res.status(201).json({
                                    success: true,
                                    message: `${role} account created. You can now log in.`,
                                    employee_id: employeeId
                                });
                            }
                        );
                    }
                );
            };

            insertWithGeneratedId(0);
        });
    });
};

module.exports = { login, register, logout, getEmployeeIdPreview };