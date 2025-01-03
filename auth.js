const sql = require('mssql');

const handleLogin = async (req, res) => {
    const { username, password, server, database } = req.body;
    const config = {
        user: username,
        password: password,
        server: server,
        database: database,
        options: {
            encrypt: true,
            enableArithAbort: true
        }
    };

    try {
        await sql.connect(config);
        req.session.regenerate((err) => {
            if (err) {
                return res.status(500).json({ message: 'Failed to regenerate session', error: err.message });
            }
            req.session.user = username;
            req.session.config = config;
            console.log('Session regenerated and user logged in:', username);
            res.json({ message: 'Login successful' });
        });
    } catch (err) {
        res.status(401).json({ message: 'Invalid credentials or unable to connect to the database', error: err.message });
    }
};

const handleLogout = async (req, res) => {
    try {
        await sql.close(); // Disconnect from the database
        req.session.destroy((err) => {
            if (err) {
                console.error('Failed to destroy session:', err.message);
                return res.status(500).json({ message: 'Failed to destroy session', error: err.message });
            }
            console.log('Session destroyed');
            res.clearCookie('connect.sid'); // Clear the session cookie
            res.redirect('/login');
        });
    } catch (err) {
        console.error('Failed to disconnect from the database:', err.message);
        res.status(500).json({ message: 'Failed to disconnect from the database', error: err.message });
    }
};

const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    } else {
        res.redirect('/login');
    }
};

module.exports = {
    handleLogin,
    handleLogout,
    isAuthenticated
};
