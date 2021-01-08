const Pool = require("pg").Pool;

const pool = new Pool({
    user : "postgres",
    password : "admin",
    host : "127.0.0.1",
    port : 5432,
    database : "djublee"
});

module.exports = pool;