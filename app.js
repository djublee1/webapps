const express = require('express')
const expressLayouts = require('express-ejs-layouts')

const app = express()
const port = 8000

const cors = require("cors");
const pool = require("./db");


// Static Files
app.use(express.static('public'))
app.use('/css', express.static(__dirname + '/css'))
app.use('/js', express.static(__dirname + '/js'))

app.use(cors());
app.use(express.json());

// Set Templating Engine
app.use(expressLayouts)
app.set('layout', './layouts/layout')
app.set('view engine', 'ejs')

// Navigation
app.get('', (req, res) => {
    res.render('index')
})

// app.get('/car', (req, res) => {
//     res.render('car')
// })

// app.get('/merk', (req, res) => {
//     res.render('merk')
// })

//Routes

//Create
app.post("/merk", async (req, res) => {
    try {
        const { name } = req.body;
        const addMerk = await pool.query("INSERT INTO merk (name) values ($1) RETURNING *", [name]);
        res.json(addMerk.rows[0]);
    } catch (error) {
        res.json(error.message);
    }
});

//Get All and By Id
app.get("/merk", async (req, res) => {
    try {
        const getMerk = await pool.query("SELECT * FROM merk");
        res.json(getMerk.rows);
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/merk/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const getMerk = await pool.query("SELECT * FROM merk WHERE id = $1", [id]);
        res.json(getMerk.rows[0]);
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/berita/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const getMerk = await pool.query("SELECT * FROM berita WHERE id = $1", [id]);
        res.json(getMerk.rows[0]);
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/berita/", async (req, res) => {
    try {
        const { id } = req.params;
        const getMerk = await pool.query("SELECT * FROM berita WHERE id = $1", [id]);
        res.json(getMerk.rows[0]);
    } catch (error) {
        res.json(error.message);
    }
});

// Update
app.put("/merk/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const getMerk = await pool.query("UPDATE merk set name = $1 where id = $2", [name, id]);
        res.json(true);
    } catch (error) {
        res.json(error.message);
    }
});

//delete
app.delete("/merk/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const getMerk = await pool.query("DELETE FROM merk where id = $1", [id]);
        res.json(true);
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/video/", async (req, res) => {
    try {
        const { id } = req.params;
        const getMerk = await pool.query("Select * FROM video", [id]);
        res.json(true);
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/merk/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const getMerk = await pool.query("DELETE FROM merk where id = $1", [id]);
        res.json(true);
    } catch (error) {
        res.json(error.message);
    }
});

// Listen  
app.listen(port, () => console.info(`App listening on port ${port}`))