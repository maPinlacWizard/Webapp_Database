const express = require('express');
const bodyParser = require('body-parser');
const sql = require('mssql');
const path = require('path');
const session = require('express-session');
const { connectDB, getPrimaryKey, getNextId } = require('./db'); // Import the helper functions
const { handleLogin, handleLogout, isAuthenticated } = require('./auth'); // Import the auth functions

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
    secret: 'your_secret_key', // Replace with your own secret key
    resave: false,
    saveUninitialized: true
})); // Manage user sessions

// Serve login page
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle login
app.post('/api/login', handleLogin);

// Logout route
app.get('/logout', handleLogout);

// Protect routes
app.use('/api', isAuthenticated);

// Serve dashboard page
app.get('/dashboard', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Middleware to set the database connection for each request
app.use(async (req, res, next) => {
    if (req.session.config) {
        console.log('Using database config:', req.session.config);
        try {
            await sql.connect(req.session.config);
            next();
        } catch (err) {
            console.error('Database connection failed:', err.message);
            res.status(500).json({ message: 'Database connection failed', error: err.message });
        }
    } else {
        res.status(401).json({ message: 'Not authenticated' });
    }
});

// Test route to verify database connection
app.get('/api/test-connection', async (req, res) => {
    try {
        const result = await sql.query`SELECT 1 AS test`;
        res.json({ message: 'Database connection successful', result: result.recordset });
    } catch (err) {
        console.error('Database connection failed:', err.message);
        res.status(500).json({ message: 'Database connection failed', error: err.message });
    }
});

// Route to fetch list of tables
app.get('/api/tables', async (req, res) => {
    console.log('Fetching list of tables from database');
    try {
        const result = await sql.query`SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE'`;
        console.log('Fetched tables:', result.recordset);
        res.json(result.recordset);
    } catch (err) {
        console.error('Error fetching tables:', err.message);
        res.status(500).json({ message: 'Error fetching tables', error: err.message });
    }
});

// Route to fetch table schema
app.get('/api/schema/:table', async (req, res) => {
    const { table } = req.params;
    console.log(`Fetching schema for table: ${table}`);
    try {
        const result = await sql.query`SELECT COLUMN_NAME, DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ${table}`;
        console.log(`Fetched schema for table ${table}:`, result.recordset);
        res.json(result.recordset);
    } catch (err) {
        console.error(`Error fetching schema for table ${table}:`, err.message);
        res.status(500).json({ message: `Error fetching schema for table ${table}`, error: err.message });
    }
});

// Route to fetch the primary key for a given table
app.get('/api/primary-key/:table', async (req, res) => {
    const { table } = req.params;
    console.log(`Fetching primary key for table: ${table}`);
    try {
        const primaryKey = await getPrimaryKey(table);
        console.log(`Primary key for table ${table}: ${primaryKey}`); // Log the primary key
        res.json({ primaryKey });
    } catch (err) {
        console.error(`Error fetching primary key for table ${table}:`, err.message);
        res.status(500).json({ message: `Error fetching primary key for table ${table}`, error: err.message });
    }
});

// Route to fetch the next ID for a given table and column
app.get('/api/next-id/:table/:column', async (req, res) => {
    const { table, column } = req.params;
    console.log(`Fetching next ID for table: ${table}, column: ${column}`);
    try {
        const nextId = await getNextId(table, column);
        res.json({ nextId });
    } catch (err) {
        console.error(`Error fetching next ID for table ${table}, column ${column}:`, err.message);
        res.status(500).json({ message: `Error fetching next ID for table ${table}, column ${column}`, error: err.message });
    }
});

// Routes to fetch data from each table
app.get('/api/:table', async (req, res) => {
    const { table } = req.params;
    console.log(`Fetching data from table: ${table}`);
    try {
        const result = await sql.query(`SELECT * FROM ${table}`);
        console.log(`Fetched data from ${table}:`, result.recordset);
        res.json(result.recordset);
    } catch (err) {
        console.error(`Error fetching data from ${table}:`, err.message);
        res.status(500).json({ message: `Error fetching data from ${table}`, error: err.message });
    }
});

app.get('/api/:table/:id', async (req, res) => {
    const { table, id } = req.params;
    console.log(`Fetching data from table: ${table} with ID: ${id}`);
    try {
        const primaryKey = await getPrimaryKey(table);
        const result = await sql.query(`SELECT * FROM ${table} WHERE ${primaryKey} = ${id}`);
        console.log(`Fetched data from ${table} with ID ${id}:`, result.recordset);
        res.json(result.recordset[0]);
    } catch (err) {
        console.error(`Error fetching data from ${table} with ID ${id}:`, err.message);
        res.status(500).json({ message: `Error fetching data from ${table} with ID ${id}`, error: err.message });
    }
});

app.post('/api/:table', async (req, res) => {
    const { table } = req.params;
    const record = req.body;
    console.log(`Adding record to table: ${table}`, record);
    try {
        const primaryKey = await getPrimaryKey(table);
        const nextId = await getNextId(table, primaryKey);
        record[primaryKey] = nextId;

        const columns = Object.keys(record).join(', ');
        const values = Object.values(record).map(value => `'${value}'`).join(', ');
        const query = `INSERT INTO ${table} (${columns}) VALUES (${values})`;
        const result = await sql.query(query);
        console.log(`Record added to ${table}:`, result);
        res.json({ message: 'Record added successfully', result });
    } catch (err) {
        console.error(`Error adding record to ${table}:`, err.message);
        res.status(500).json({ message: `Error adding record to ${table}`, error: err.message });
    }
});

app.put('/api/:table/:id', async (req, res) => {
    const { table, id } = req.params;
    const record = req.body;
    console.log(`Updating record in table: ${table}`, record);
    try {
        const updates = Object.keys(record).map(key => `${key} = '${record[key]}'`).join(', ');
        const idColumn = Object.keys(record).find(key => key.toLowerCase().includes('id'));
        const query = `UPDATE ${table} SET ${updates} WHERE ${idColumn} = ${id}`;
        const result = await sql.query(query);
        console.log(`Record updated in ${table}:`, result);
        res.json({ message: 'Record updated successfully', result });
    } catch (err) {
        console.error(`Error updating record in ${table}:`, err.message);
        res.status(500).json({ message: `Error updating record in ${table}`, error: err.message });
    }
});

app.delete('/api/:table/:id', async (req, res) => {
    const { table, id } = req.params;
    console.log(`Deleting record from table: ${table} with id: ${id}`);
    try {
        const idColumn = (await sql.query`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = ${table} AND COLUMN_NAME LIKE '%ID%'`).recordset[0].COLUMN_NAME;
        const query = `DELETE FROM ${table} WHERE ${idColumn} = ${id}`;
        const result = await sql.query(query);
        console.log(`Record deleted from ${table}:`, result);
        res.json({ message: 'Record deleted successfully', result });
    } catch (err) {
        console.error(`Error deleting record from ${table}:`, err.message);
        res.status(500).json({ message: `Error deleting record from ${table}`, error: err.message });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Internal server error:', err);
    res.status(500).json({ message: 'Internal server error', error: err.message });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
