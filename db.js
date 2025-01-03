const sql = require('mssql');

const config = {
    user: 'wizardadmin', // Replace with your Azure SQL database username
    password: 'wizard01!', // Replace with your Azure SQL database password
    server: 'mapinlacwizarddatabase.database.windows.net', // Replace with your Azure SQL server name
    database: 'Simple_eCommerce_System', // Replace with your Azure SQL database name
    options: {
        encrypt: true, // Use this if you're on Windows Azure
        enableArithAbort: true // Add this line to address the deprecation warning
    },
};

const connectDB = async () => {
    try {
        await sql.connect(config);
        console.log('Azure SQL Database connected...');
    } catch (err) {
        console.error('Database connection error:', err.message);
        process.exit(1);
    }
};

const getPrimaryKey = async (table) => {
    const result = await sql.query`
        SELECT COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE OBJECTPROPERTY(OBJECT_ID(CONSTRAINT_SCHEMA + '.' + QUOTENAME(CONSTRAINT_NAME)), 'IsPrimaryKey') = 1
        AND TABLE_NAME = ${table}
    `;
    return result.recordset[0]?.COLUMN_NAME;
};

const getNextId = async (table, idColumn) => {
    const query = `SELECT MAX(${idColumn}) AS maxId FROM ${table}`;
    const result = await sql.query(query);
    const maxId = result.recordset[0].maxId;
    return maxId ? maxId + 1 : 1;
};

module.exports = {
    connectDB,
    getPrimaryKey,
    getNextId
};
