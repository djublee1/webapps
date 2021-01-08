const express = require("express");
const expressLayouts = require('express-ejs-layouts')
const path = require('path');
const app = express();
const cors = require("cors");
const pool = require("./db");
const NewsAPI = require('newsapi');
const newsapi = new NewsAPI('510bfff3b73d461b9b5729fbe1019ec0');

var bodyParser = require('body-parser');
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

//midleware
app.use(cors());
app.use(express.json());

// Static Files
app.use(express.static('public'))
app.use('/css', express.static(__dirname + '/css'))
app.use('/js', express.static(__dirname + '/js'))
app.use(express.static(path.join(__dirname, 'public')));

// Set Templating Engine
app.use(expressLayouts)
app.set('layout', './layouts/layout')
app.set('view engine', 'ejs')

//Required upload
const multer = require('multer');
const fs = require('fs');
const uuidv4 = require('uuidv4'); 

//Routes
var storage = multer.diskStorage({
    destination: function(req, file, calback){
        var dir =  "./public/uploads";
        if(!fs.existsSync(dir)){
            fs.mkdirSync(dir);
        }
        calback(null, dir);
    },
    filename: function(req, file, calback){
        if (!Date.now) {
            Date.now = function() { return new Date().getTime(); }
        }
        var filename = Math.floor(Date.now() / 1000) + file.originalname;
        calback(null, filename);
    }
});

var upload = multer({storage: storage}).fields([
    {name: "photoutama", maxCount: 12}, 
    {name: "imgBerita", maxCount: 12}, 
    {name: "photoeksterior", maxCount: 12}, 
    {name: "photointerior", maxCount: 12}, 
    {name: "photodimensi", maxCount: 12}, 
    {name: "photomesin", maxCount: 12}, 
    {name: "photoperforma", maxCount: 12}, 
    {name: "photosafety", maxCount: 12}, 
    {name: "photoentertaiment", maxCount: 12}, 
    {name: "videoFile", maxCount: 12}
]);

app.get("/berita/api", async (req, res) => {
    try {
        newsapi.v2.topHeadlines({
            category: 'technology',
            country: 'id'
          }).then(async response => {
            if(response.articles.length <= 0) return res.redirect('/mobil/');
            for(var i=0; i<response.articles.length; i++){
                var data = response.articles[i];
                console.log(data);
                const addBerita = await pool.query("INSERT INTO berita (file_name, headline, link) values ($1, $2, $3) RETURNING *", [data.urlToImage, data.title, data.url]);
            }
            return res.redirect('/berita/');
          });
        // res.json(getMerk.rows);
        
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/berita", async (req, res) => {
    try {
        let getBerita = await pool.query("SELECT * FROM berita");
        let data = [];
        for(var i=0; i<getBerita.rows.length; i++){
            data.push(getBerita.rows[i]);
        }
        // res.json(getMerk.rows);
        res.render('berita/index', {data:data});
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/berita/edit/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getMerk = await pool.query("SELECT * FROM berita WHERE id = $1", [id]);
        let data = getMerk.rows[0];
        let getMobil = await pool.query("SELECT m.id, a.name as merk, b.name as group_model, c.name as model, t.tahun as tahun FROM mobil m left join merk a on m.merk_id = a.id left join group_model b on m.type_id = b.id left join model c on m.model_id = c.id left join tahun t on t.id = m.tahun_id ");
        let dataMobil = [];
        for(var i=0; i<getMobil.rows.length; i++){
            dataMobil.push(getMobil.rows[i]);
        }
        console.log(dataMobil);
        // res.json(getMerk.rows);
        res.render('berita/edit', {data:data, dataMobil:dataMobil});
        // res.json(getMerk.rows[0]);
    } catch (error) {
        res.json(error.message);
    }
});

app.post("/berita/update/", async (req, res) => {
    try {
        var data = req.body;
        const getMerk = await pool.query("UPDATE berita set headline = $1, mobil_id = $2 where id = $3", [data.headline, data.mobil, data.id]);
        // res.json(true);
        res.redirect('/berita');
    } catch (error) {
        res.json(error.message);
    }
});

//Create
app.post("/merk/create", async (req, res) => {
    try {
        // const { name } = req.params;
        var data = req.body;
        const addMerk = await pool.query("INSERT INTO merk (name) values ($1) RETURNING *", [data.name]);
        res.redirect('/merk');
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/merk/create", async (req, res) => {
    try {
        let getMerk = await pool.query("SELECT * FROM merk");
        let data = [];
        for(var i=0; i<getMerk.rows.length; i++){
            data.push(getMerk.rows[i]);
        }
        // res.json(getMerk.rows);
        res.render('merk/create', {data:data});
    } catch (error) {
        res.json(error.message);
    }
});
//Get All and By Id
app.get("/merk", async (req, res) => {
    try {
        let getMerk = await pool.query("SELECT * FROM merk");
        let data = [];
        for(var i=0; i<getMerk.rows.length; i++){
            data.push(getMerk.rows[i]);
        }
        // res.json(getMerk.rows);
        res.render('merk/merk', {data:data});
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/merk/edit/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getMerk = await pool.query("SELECT * FROM merk WHERE id = $1", [id]);
        let data = getMerk.rows[0];
        // res.json(getMerk.rows);
        res.render('merk/edit', {data:data});
        // res.json(getMerk.rows[0]);
    } catch (error) {
        res.json(error.message);
    }
});


// Update
app.post("/merk/update/", async (req, res) => {
    try {
        // const { id } = req.params;
        // const { name } = req.body;
        var data = req.body;
        const getMerk = await pool.query("UPDATE merk set name = $1 where id = $2", [data.name, data.id]);
        // res.json(true);
        res.redirect('/merk');
    } catch (error) {
        res.json(error.message);
    }
});

//delete
app.get("/merk/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const getMerk = await pool.query("DELETE FROM merk where id = $1", [id]);
        res.redirect('/merk');
    } catch (error) {
        res.json(error.message);
    }
});

/////////////////////////////////////////////
app.post("/tahun/create", async (req, res) => {
    try {
        // const { name } = req.params;
        var data = req.body;
        const addtahun = await pool.query("INSERT INTO tahun (id, tahun) values ($1, $2) RETURNING *", [data.tahun, data.tahun]);
        res.redirect('/tahun');
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/tahun/create", async (req, res) => {
    try {
        let gettahun = await pool.query("SELECT * FROM tahun");
        let data = [];
        for(var i=0; i<gettahun.rows.length; i++){
            data.push(gettahun.rows[i]);
        }
        // res.json(gettahun.rows);
        res.render('tahun/create', {data:data});
    } catch (error) {
        res.json(error.message);
    }
});
//Get All and By Id
app.get("/tahun", async (req, res) => {
    try {
        let gettahun = await pool.query("SELECT * FROM tahun ORDER BY tahun DESC");
        let data = [];
        for(var i=0; i<gettahun.rows.length; i++){
            data.push(gettahun.rows[i]);
        }
        // res.json(gettahun.rows);
        res.render('tahun/tahun', {data:data});
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/tahun/edit/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let gettahun = await pool.query("SELECT * FROM tahun WHERE id = $1", [id]);
        let data = gettahun.rows[0];
        // res.json(gettahun.rows);
        res.render('tahun/edit', {data:data});
        // res.json(gettahun.rows[0]);
    } catch (error) {
        res.json(error.message);
    }
});

// Update
app.post("/tahun/update/", async (req, res) => {
    try {
        // const { id } = req.params;
        // const { name } = req.body;
        var data = req.body;
        const gettahun = await pool.query("UPDATE tahun set id = $1, tahun = $2 where id = $3", [data.tahun, data.tahun, data.id]);
        // res.json(true);
        res.redirect('/tahun');
    } catch (error) {
        res.json(error.message);
    }
});

//delete
app.get("/tahun/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const gettahun = await pool.query("DELETE FROM tahun where id = $1", [id]);
        res.redirect('/tahun');
    } catch (error) {
        res.json(error.message);
    }
});

/////////////////////MODEL/////////////////////////////
app.get("/model/json/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const getmodel = await pool.query("SELECT * FROM model where group_model_id = $1", [id]);
        res.json(getmodel.rows);
    } catch (error) {
        res.json(error.message);
    }
});

app.post("/model/create", async (req, res) => {
    try {
        // const { name } = req.params;
        var data = req.body;
        const addmodel = await pool.query("INSERT INTO model (name, group_model_id, merk_id) values ($1, $2, $3) RETURNING *", [data.name, data.groupmodel, data.merk]);
        res.redirect('/model');
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/model/create", async (req, res) => {
    try {
        let getmodel = await pool.query("SELECT * FROM model");
        let data = [];
        for(var i=0; i<getmodel.rows.length; i++){
            data.push(getmodel.rows[i]);
        }
        let getMerk = await pool.query("SELECT * FROM merk");
        let dataMerk = [];
        for(var i=0; i<getMerk.rows.length; i++){
            dataMerk.push(getMerk.rows[i]);
        }
        let getGroupModel = await pool.query("SELECT * FROM group_model");
        let dataGroup = [];
        for(var i=0; i<getGroupModel.rows.length; i++){
            dataGroup.push(getGroupModel.rows[i]);
        }

        // res.json(getmodel.rows);
        res.render('model/create', {data:data, merk:dataMerk, groupmodel:dataGroup});
    } catch (error) {
        res.json(error.message);
    }
});
//Get All and By Id
app.get("/model", async (req, res) => {
    try {
        let getmodel = await pool.query("SELECT model.*, group_model.name as group_model_name, merk.name as merk_name FROM model left join group_model on group_model.id = model.group_model_id left join merk on merk.id = model.merk_id");
        let data = [];
        for(var i=0; i<getmodel.rows.length; i++){
            data.push(getmodel.rows[i]);
        }
        // res.json(getmodel.rows);
        res.render('model/index', {data:data});
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/model/edit/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getmodel = await pool.query("SELECT model.*, group_model.id as group_model_id, merk.id as merk_id FROM model left join group_model on group_model.id = model.group_model_id left join merk on merk.id = model.merk_id WHERE model.id = $1", [id]);
        let data = getmodel.rows[0];

        let getMerk = await pool.query("SELECT * FROM merk");
        let dataMerk = [];
        for(var i=0; i<getMerk.rows.length; i++){
            dataMerk.push(getMerk.rows[i]);
        }
        let getGroupModel = await pool.query("SELECT * FROM group_model");
        let dataGroup = [];
        for(var i=0; i<getGroupModel.rows.length; i++){
            dataGroup.push(getGroupModel.rows[i]);
        }

        // res.json(getmodel.rows);
        res.render('model/edit', {data:data, merk:dataMerk, groupmodel:dataGroup});
        // res.json(getmodel.rows[0]);
    } catch (error) {
        res.json(error.message);
    }
});

// Update
app.post("/model/update/", async (req, res) => {
    try {
        // const { id } = req.params;
        // const { name } = req.body;
        var data = req.body;
        const getmodel = await pool.query("UPDATE model set name = $1, group_model_id = $2, merk_id = $3 where id = $4", [data.name,data.groupmodel,data.merk, data.id]);
        // res.json(true);
        res.redirect('/model');
    } catch (error) {
        res.json(error.message);
    }
});

//delete
app.get("/model/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const getmodel = await pool.query("DELETE FROM model where id = $1", [id]);
        res.redirect('/model');
    } catch (error) {
        res.json(error.message);
    }
});

////////////////////////////////////////
app.get("/groupmodel/json/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getgroupmodel = await pool.query("SELECT * FROM group_model WHERE merk_id = $1", [id]);
        let data = getgroupmodel.rows;
        res.json(getgroupmodel.rows);
    } catch (error) {
        res.json(error.message);
    }
});

app.post("/groupmodel/create", async (req, res) => {
    try {
        // const { name } = req.params;
        var data = req.body;
        const addgroupmodel = await pool.query("INSERT INTO group_model (name, merk_id) values ($1, $2) RETURNING *", [data.name, data.merk]);
        res.redirect('/groupmodel');
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/groupmodel/create", async (req, res) => {
    try {
        let getgroupmodel = await pool.query("SELECT * FROM group_model");
        let data = [];
        for(var i=0; i<getgroupmodel.rows.length; i++){
            data.push(getgroupmodel.rows[i]);
        }

        let getMerk = await pool.query("SELECT * FROM merk");
        let dataMerk = [];
        for(var i=0; i<getMerk.rows.length; i++){
            dataMerk.push(getMerk.rows[i]);
        }
        // res.json(getgroupmodel.rows);
        res.render('groupmodel/create', {data:data, merk:dataMerk});
    } catch (error) {
        res.json(error.message);
    }
});
//Get All and By Id
app.get("/groupmodel", async (req, res) => {
    try {
        let getgroupmodel = await pool.query("SELECT group_model.*, merk.name as merk_name  FROM group_model left join merk on merk.id = group_model.merk_id");
        let data = [];
        for(var i=0; i<getgroupmodel.rows.length; i++){
            data.push(getgroupmodel.rows[i]);
        }
        // res.json(getgroupmodel.rows);
        res.render('groupmodel/index', {data:data});
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/groupmodel/edit/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getgroupmodel = await pool.query("SELECT group_model.*, merk.id as merk_id, merk.name as merk_name FROM group_model left join merk on merk.id = group_model.merk_id  WHERE group_model.id = $1", [id]);
        let data = getgroupmodel.rows[0];

        let getMerk = await pool.query("SELECT * FROM merk");
        let dataMerk = [];
        for(var i=0; i<getMerk.rows.length; i++){
            dataMerk.push(getMerk.rows[i]);
        }
        // res.json(getgroupmodel.rows);
        res.render('groupmodel/edit', {data:data, merk:dataMerk});
        // res.json(getgroupmodel.rows[0]);
    } catch (error) {
        res.json(error.message);
    }
});

// Update
app.post("/groupmodel/update/", async (req, res) => {
    try {
        // const { id } = req.params;
        // const { name } = req.body;
        var data = req.body;
        const getgroupmodel = await pool.query("UPDATE group_model set name = $1, merk_id = $2 where id = $3", [data.name, data.merk, data.id]);
        // res.json(true);
        res.redirect('/groupmodel');
    } catch (error) {
        res.json(error.message);
    }
});

//delete
app.get("/groupmodel/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const getgroupmodel = await pool.query("DELETE FROM group_model where id = $1", [id]);
        res.redirect('/groupmodel');
    } catch (error) {
        res.json(error.message);
    }
});

//////////////Mobil///////////////////

app.get("/mobil/create", async (req, res) => {
    try {
        // let getMobil = await pool.query("SELECT * FROM mobil");
        let getMerk = await pool.query("SELECT * FROM merk");
        let dataMerk = [];
        for(var i=0; i<getMerk.rows.length; i++){
            dataMerk.push(getMerk.rows[i]);
        }
        let getGroupModel = await pool.query("SELECT * FROM group_model");
        let dataGroup = [];
        for(var i=0; i<getGroupModel.rows.length; i++){
            dataGroup.push(getGroupModel.rows[i]);
        }
        let getModel = await pool.query("SELECT * FROM model");
        let dataModel = [];
        for(var i=0; i<getModel.rows.length; i++){
            dataModel.push(getModel.rows[i]);
        }

        let getTahun = await pool.query("SELECT * FROM tahun");
        let dataTahun = [];
        for(var i=0; i<getTahun.rows.length; i++){
            dataTahun.push(getTahun.rows[i]);
        }

        var data = req.body;
        var queryString = req.query;
        var isCopy = queryString.iscopy != undefined ? queryString.iscopy : "0";

        res.render('mobil/create', {merk:dataMerk, groupmodel:dataGroup, model:dataModel, tahun: dataTahun, iscopy:isCopy});
    } catch (error) {
        res.json(error.message);
    }
});

function getRangeYear(startYear, endYear) {
    var years = [];
    if(endYear == null || endYear == "") endYear = startYear;
    // console.log(startYear);
    // console.log(endYear);
    while ( startYear <= endYear ) {
        years.push(startYear++);
    }   
    return years;
}

app.post("/mobil/create", async (req, res, next) => {
    try {
        // const { name } = req.params;
        upload(req, res, async function (err){
            if(err){
                console.log("Something gone wrong");
                // return res.send("Something gone wrong");
            }

            var data = req.body;
            var years = getRangeYear(data.from, data.to);

            let dataMobilExist = await pool.query("select * from mobil where merk_id = $1 and type_id = $2 and model_id = $3 and tahun_id = $4", [data.merk, data.groupmodel, data.model, data.from]);
            if(dataMobilExist.rows.length > 0 && data.iscopy == 1){
                return res.redirect('/mobil/edit/' + data.mobil_id);
            }

            var parent_id = "";
            for (let i = 0; i < years.length; i++) {
                var dataHeader = BindDataHeader(data, years[i]);
                const addMobil = await pool.query("INSERT INTO mobil (merk_id, model_id, type_id, tahun_id) values ($1, $2, $3, $4) RETURNING *", dataHeader);
                parent_id = addMobil.rows[0].id;

                var dataSpesifikasiMesin = BindDataSpesifikasiMesin(data, parent_id);
                var sqlSpesifikasiMesin = "INSERT INTO public.spesifikasi_mesin(mobild_id, tipe, kapasitas_tangki, max_torque, valve_per_cylinder, transmisi, clutch, kapasitas_mesin, max_power, cylinder, turbo_charged, gearbox) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *"
                const addSpesifikasiMesin = await pool.query(sqlSpesifikasiMesin, dataSpesifikasiMesin);
                var mesin_parent_id = addSpesifikasiMesin.rows[0].id;
                var mesin_photo = req.files.photomesin;
                if(mesin_photo != null){
                    for (let index = 0; index < mesin_photo.length; index++) {
                        const element = mesin_photo[index];
                        var dataPhotoMesin = [element.filename, mesin_parent_id];
                        var sqlSpesifikasiMesinPhoto = "INSERT INTO spesifikasi_mesin_photo (file_name, spesifikasi_mesin_id) VALUES ($1, $2) RETURNING *";
                        const addSpesifikasiMesinPhoto = await pool.query(sqlSpesifikasiMesinPhoto, dataPhotoMesin);
                    }
                }

                var dataSpesifikasiPerforma = BindDataSpesifikasiPerforma(data, parent_id);
                var sqlSpesifikasiPerforma = "INSERT INTO public.spesifikasi_performa(mobil_id, akselerasi, mile, tipe_bahan_bakar, konsumsi_bahan_bakar_tol, top_speed, braking, konsumsi_bahan_bakar_normal) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *"
                const addSpesifikasiPerforma = await pool.query(sqlSpesifikasiPerforma, dataSpesifikasiPerforma);
                var performa_parent_id = addSpesifikasiPerforma.rows[0].id;
                var performa_photo = req.files.photoperforma;
                if(performa_photo != null){
                    for (let index = 0; index < performa_photo.length; index++) {
                        const element = performa_photo[index];
                        var dataPhotoperforma = [element.filename, performa_parent_id];
                        var sqlSpesifikasiperformaPhoto = "INSERT INTO spesifikasi_performa_photo (file_name, spesifikasi_performa_id) VALUES ($1, $2) RETURNING *";
                        const addSpesifikasiperformaPhoto = await pool.query(sqlSpesifikasiperformaPhoto, dataPhotoperforma);
                    }
                }

                var dataSpesifikasiDimensi = BindDataSpesifikasiDimensi(data, parent_id);
                var sqlSpesifikasiDimensi = "INSERT INTO public.spesifikasi_dimensi(mobil_id, lxwxhx, wheel_base, kapasitas_bagasi, ground_clearance, kapasitas_penumpang, jumlah_pintu) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *"
                const addSpesifikasiDimensi = await pool.query(sqlSpesifikasiDimensi, dataSpesifikasiDimensi);
                var dimensi_parent_id = addSpesifikasiDimensi.rows[0].id;
                var dimensi_photo = req.files.photodimensi;
                if(dimensi_photo != null){
                    for (let index = 0; index < dimensi_photo.length; index++) {
                        const element = dimensi_photo[index];
                        var dataPhotodimensi = [element.filename, dimensi_parent_id];
                        var sqlSpesifikasidimensiPhoto = "INSERT INTO spesifikasi_dimensi_photo (file_name, spesifikasi_dimensi_id) VALUES ($1, $2) RETURNING *";
                        const addSpesifikasidimensiPhoto = await pool.query(sqlSpesifikasidimensiPhoto, dataPhotodimensi);
                    }
                }

                var dataSpesifikasiEksterior = BindDataSpesifikasiEksterior(data, parent_id);
                var sqlSpesifikasiEksterior = "INSERT INTO public.spesifikasi_eksterior(mobil_id, warna, spion_electric, spion_folding, spion_lampu_signal, fog_lamp, door_handle, keyless_entry_pintu_penumpang, keyless_entry_bagasi, sun_roof, tipe_cat, head_light, tail_light, signal_light, door_soft_close, parking_sensor, bentuk_knalpot) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) RETURNING *"
                const addSpesifikasiEksterior = await pool.query(sqlSpesifikasiEksterior, dataSpesifikasiEksterior);
                var eksterior_parent_id = addSpesifikasiEksterior.rows[0].id;
                var eksterior_photo = req.files.photoeksterior;
                if(eksterior_photo != null){
                    for (let index = 0; index < eksterior_photo.length; index++) {
                        const element = eksterior_photo[index];
                        var dataPhotoeksterior = [element.filename, eksterior_parent_id];
                        var sqlSpesifikasieksteriorPhoto = "INSERT INTO spesifikasi_eksterior_photo (file_name, spesifikasi_eksterior_id) VALUES ($1, $2) RETURNING *";
                        const addSpesifikasieksteriorPhoto = await pool.query(sqlSpesifikasieksteriorPhoto, dataPhotoeksterior);
                    }
                }

                var dataSpesifikasiInterior = BindDataSpesifikasiInterior(data, parent_id);
                var sqlSpesifikasiInterior = "INSERT INTO public.spesifikasi_interior(jok_kulit, power_bagasi, central_lock_driver, central_lock_front_passanger, central_lock_rear_passanger, digital_dashboard, heads_up_display, touch_screen_display_jumlah, touch_screen_display_ukuran, number_of_vent_front, number_of_vent_rear, rear_passanger_tv, cool_box, vanity_mirror, power_window, power_seat, engine_start_stop, central_lock_adjustable, central_lock_cruise_control, central_lock_audio_control, central_lock_gearshift_paddle, navigation, air_conditioner_double_blower, air_conditioner_touch_screen_control, voice_command_control, rear_passanger_controller, ambience_lightning, folding_table, mobil_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29) RETURNING *"
                const addSpesifikasiInterior = await pool.query(sqlSpesifikasiInterior, dataSpesifikasiInterior);
                var interior_parent_id = addSpesifikasiInterior.rows[0].id;
                var interior_photo = req.files.photointerior;
                if(interior_photo != null){
                    for (let index = 0; index < interior_photo.length; index++) {
                        const element = interior_photo[index];
                        var dataPhotointerior = [element.filename, interior_parent_id];
                        var sqlSpesifikasiinteriorPhoto = "INSERT INTO spesifikasi_interior_photo (file_name, spesifikasi_interior_id) VALUES ($1, $2) RETURNING *";
                        const addSpesifikasiinteriorPhoto = await pool.query(sqlSpesifikasiinteriorPhoto, dataPhotointerior);
                    }
                }

                var dataSpesifikasiEntertaiment = BindDataSpesifikasiEntertaiment(data, parent_id);
                var sqlSpesifikasiEntertaiment = "INSERT INTO spesifikasi_entertaiment (usb_and_aux, android_auto, speaker_brand, speaker_front, speaker_rear, bluetooth, apple_car_play, radio_cd_dvd, rear_tv_display, rear_passanger_controller, mobil_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *";
                const addSpesifikasiEntertaiment = await pool.query(sqlSpesifikasiEntertaiment, dataSpesifikasiEntertaiment);
                var entertaiment_parent_id = addSpesifikasiEntertaiment.rows[0].id;
                var entertaiment_photo = req.files.photoentertaiment;
                if(entertaiment_photo != null){
                    for (let index = 0; index < entertaiment_photo.length; index++) {
                        const element = entertaiment_photo[index];
                        var dataPhotoentertaiment = [element.filename, entertaiment_parent_id];
                        var sqlSpesifikasientertaimentPhoto = "INSERT INTO spesifikasi_entertaiment_photo (file_name, spesifikasi_entertaiment_id) VALUES ($1, $2) RETURNING *";
                        const addSpesifikasientertaimentPhoto = await pool.query(sqlSpesifikasientertaimentPhoto, dataPhotoentertaiment);
                    }
                }

                var dataSpesifikasiSafety = BindDataSpesifikasiSafety(data, parent_id);
                var sqlSpesifikasiSafety = "INSERT INTO public.spesifikasi_safety(mobil_id, seat_belts, airbag_driver, airbag_front_passanger, airbag_rear_passanger, electronic_stability_control, rear_cross_traffic_control, forward_collision_warning, blind_spot_warning, night_vision, engine_immobilizer, seat_belts_reminder, child_safety_lock, abs, automatic_emergency_brake, adaptive_cruise_control, lane_departure_warning_and_assist, autonomus_driving, anti_thef_alarm, crash_test_rating) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20) RETURNING *";
                const addSpesifikasiSafety = await pool.query(sqlSpesifikasiSafety, dataSpesifikasiSafety);
                var safety_parent_id = addSpesifikasiSafety.rows[0].id;
                var safety_photo = req.files.photosafety;
                if(safety_photo != null){
                    for (let index = 0; index < safety_photo.length; index++) {
                        const element = safety_photo[index];
                        var dataPhotosafety = [element.filename, safety_parent_id];
                        var sqlSpesifikasisafetyPhoto = "INSERT INTO spesifikasi_safety_photo (file_name, spesifikasi_safety_id) VALUES ($1, $2) RETURNING *";
                        const addSpesifikasisafetyPhoto = await pool.query(sqlSpesifikasisafetyPhoto, dataPhotosafety);
                    }
                }

                var files = req.files.photoutama;
                if(files != null){
                    for (let index = 0; index < files.length; index++) {
                        const element = files[index];
                        var dataPhotos = [parent_id, element.filename];
                        var sqlSpesifikasiPhotos = "INSERT INTO public.spesifikasi_photos (mobil_id, file_name) VALUES ($1, $2) RETURNING *";
                        const addSpesifikasiPhotos = await pool.query(sqlSpesifikasiPhotos, dataPhotos);
                    }
                }

                var berita = req.files.imgBerita;
                if(berita != null){
                    for (let index = 0; index < berita.length; index++) {
                        const element = berita[index];
                        var dataBerita = [element.filename, data.headline_berita, data.link_berita, parent_id];
                        var sqlSpesifikasiBerita = "INSERT INTO berita (file_name, headline, link, mobil_id) VALUES ($1, $2, $3, $4) RETURNING *";
                        const addSpesifikasiBerita = await pool.query(sqlSpesifikasiBerita, dataBerita);
                    }
                }

                var video = req.files.videoFile;
                if(video != null){
                    for (let index = 0; index < video.length; index++) {
                        const element = video[index];
                        var dataVideo = [parent_id, element.filename, data.headline_video, data.link_video];
                        var sqlSpesifikasiVideo = "INSERT INTO public.video (mobil_id, file_name, headline_video, link_video) VALUES ($1, $2, $3, $4) RETURNING *";
                        const addSpesifikasiVideo = await pool.query(sqlSpesifikasiVideo, dataVideo);
                    }
                }else{
                    var dataVideo = [parent_id, data.headline_video, data.link_video];
                    var sqlSpesifikasiVideo = "INSERT INTO public.video (mobil_id, headline_video, link_video) VALUES ($1, $2, $3) RETURNING *";
                    const addSpesifikasiVideo = await pool.query(sqlSpesifikasiVideo, dataVideo);
                }
            }

            res.redirect('/mobil/detail/' + parent_id);
        });

       
    } catch (error) {
        res.json(error.message);
    }
});

function BindDataHeader(data, tahun){
    var result = [];
    result.push(data.merk);
    result.push(data.model);
    result.push(data.groupmodel);
    result.push(tahun);
    return result;
}

function BindDataHeaderEdit(data, tahun){
    var result = [];
    result.push(data.merk);
    result.push(data.model);
    result.push(data.groupmodel);
    result.push(tahun);
    result.push(data.mobil_id);
    return result;
}

function BindDataSpesifikasiEntertaiment(data, parent_id){
    var result = [];
    result.push(data.usb);
    result.push(data.android);
    result.push(data.speaker_brand);
    result.push(data.speaker_front);
    result.push(data.speaker_rear);
    result.push(data.bluetooth);
    result.push(data.apple);
    result.push(data.radio_cd_dvd);
    result.push(data.rear_tv_display);
    result.push(data.rear_passanger_controller);
    result.push(parent_id);
    return result;
}

function BindDataSpesifikasiSafety(data, parent_id){
    var result = [];
    result.push(parent_id);
    result.push(data.seat_belt);

    if(data.airbag_driver){
        result.push(true);
    }else{
        result.push(false);
    }

    if(data.airbag_front_passanger){
        result.push(true);
    }else{
        result.push(false);
    }
    
    if(data.airbag_rear_passanger){
        result.push(true);
    }else{
        result.push(false);
    }

    result.push(data.electronic_stability_control);
    result.push(data.rear_cross_traffic_control);
    result.push(data.forward_collision_warning);
    result.push(data.blind_spot_warning);
    result.push(data.night_vision);
    result.push(data.engine_immobilizer);
    result.push(data.seat_belts_reminder);
    result.push(data.child_safety_lock);
    result.push(data.abs);
    result.push(data.automatic_emergency_brake);
    result.push(data.adaptive_cruise_control);
    result.push(data.lane_departure_warning_and_assist);
    result.push(data.autonomus_driving);
    result.push(data.anti_thef_alarm);
    result.push(data.crash_test_rating);
    return result;
}

function BindDataSpesifikasiSafetyEdit(data, parent_id){
    var result = [];
    result.push(data.seat_belt);

    if(data.airbag_driver){
        result.push(true);
    }else{
        result.push(false);
    }

    if(data.airbag_front_passanger){
        result.push(true);
    }else{
        result.push(false);
    }
    
    if(data.airbag_rear_passanger){
        result.push(true);
    }else{
        result.push(false);
    }

    result.push(data.electronic_stability_control);
    result.push(data.rear_cross_traffic_control);
    result.push(data.forward_collision_warning);
    result.push(data.blind_spot_warning);
    result.push(data.night_vision);
    result.push(data.engine_immobilizer);
    result.push(data.seat_belts_reminder);
    result.push(data.child_safety_lock);
    result.push(data.abs);
    result.push(data.automatic_emergency_brake);
    result.push(data.adaptive_cruise_control);
    result.push(data.lane_departure_warning_and_assist);
    result.push(data.autonomus_driving);
    result.push(data.anti_thef_alarm);
    result.push(data.crash_test_rating);
    result.push(parent_id);
    return result;
}

function BindDataSpesifikasiMesin(data, parent_id){
    var result = [];
    result.push(parent_id);
    result.push(data.tipe);
    result.push(data.kapasitas_tangki);
    result.push(data.max_torque);
    result.push(data.valve_per_cylinder);
    result.push(data.transmisi);
    result.push(data.clutch);
    result.push(data.kapasitas_mesin);
    result.push(data.max_power);
    result.push(data.cylinder);
    result.push(data.turbo_charged);
    result.push(data.gearbox);
    return result;
}

function BindDataSpesifikasiMesinEdit(data, parent_id){
    var result = [];
    result.push(data.tipe);
    result.push(data.kapasitas_tangki);
    result.push(data.max_torque);
    result.push(data.valve_per_cylinder);
    result.push(data.transmisi);
    result.push(data.clutch);
    result.push(data.kapasitas_mesin);
    result.push(data.max_power);
    result.push(data.cylinder);
    result.push(data.turbo_charged);
    result.push(data.gearbox);
    result.push(parent_id);
    return result;
}

function BindDataSpesifikasiPerforma(data, parent_id){
    var result = [];
    result.push(parent_id);
    result.push(data.akselerasi);
    result.push(data.mile);
    result.push(data.tipe_bahan_bakar);
    result.push(data.konsumsi_bahan_bakar_tol);
    result.push(data.top_speed);
    result.push(data.braking);
    result.push(data.konsumsi_bahan_bakar_normal);
    return result;
}

function BindDataSpesifikasiPerformaEdit(data, parent_id){
    var result = [];
    result.push(data.akselerasi);
    result.push(data.mile);
    result.push(data.tipe_bahan_bakar);
    result.push(data.konsumsi_bahan_bakar_tol);
    result.push(data.top_speed);
    result.push(data.braking);
    result.push(data.konsumsi_bahan_bakar_normal);
    result.push(parent_id);
    return result;
}

function BindDataSpesifikasiDimensi(data, parent_id){
    var result = [];
    result.push(parent_id);
    result.push(data.lxwxhx);
    result.push(data.wheel_base);
    result.push(data.kapasitas_bagasi);
    result.push(data.ground_clearance);
    result.push(data.kapasitas_penumpang);
    result.push(data.jumlah_pintu);
    return result;
}

function BindDataSpesifikasiDimensiEdit(data, parent_id){
    var result = [];
    
    result.push(data.lxwxhx);
    result.push(data.wheel_base);
    result.push(data.kapasitas_bagasi);
    result.push(data.ground_clearance);
    result.push(data.kapasitas_penumpang);
    result.push(data.jumlah_pintu);
    result.push(parent_id);
    return result;
}

function BindDataSpesifikasiEksterior(data, parent_id){
    var result = [];
    result.push(parent_id);
    result.push(data.warna);

    if(data.spion_electric){
        result.push(true);
    }else{
        result.push(false);
    }

    if(data.spion_folding){
        result.push(true);
    }else{
        result.push(false);
    }
    
    if(data.spion_lampu_signal){
        result.push(true);
    }else{
        result.push(false);
    }

    result.push(data.fog_lamp);
    result.push(data.door_handle);

    if(data.keyless_entry_pintu_penumpang){
        result.push(true);
    }else{
        result.push(false);
    }
    
    if(data.keyless_entry_bagasi){
        result.push(true);
    }else{
        result.push(false);
    }

    result.push(data.sun_roof);
    result.push(data.tipe_cat);
    result.push(data.head_light);
    result.push(data.tail_light);
    result.push(data.signal_light);
    result.push(data.door_soft_close);
    result.push(data.parking_sensor);
    result.push(data.bentuk_knalpot);
    return result;
}

function BindDataSpesifikasiEksteriorEdit(data, parent_id){
    var result = [];
    result.push(data.warna);

    if(data.spion_electric){
        result.push(true);
    }else{
        result.push(false);
    }

    if(data.spion_folding){
        result.push(true);
    }else{
        result.push(false);
    }
    
    if(data.spion_lampu_signal){
        result.push(true);
    }else{
        result.push(false);
    }

    result.push(data.fog_lamp);
    result.push(data.door_handle);

    if(data.keyless_entry_pintu_penumpang){
        result.push(true);
    }else{
        result.push(false);
    }
    
    if(data.keyless_entry_bagasi){
        result.push(true);
    }else{
        result.push(false);
    }

    result.push(data.sun_roof);
    result.push(data.tipe_cat);
    result.push(data.head_light);
    result.push(data.tail_light);
    result.push(data.signal_light);
    result.push(data.door_soft_close);
    result.push(data.parking_sensor);
    result.push(data.bentuk_knalpot);
    result.push(parent_id);
    return result;
}

function BindDataSpesifikasiInterior(data, parent_id){
    var result = [];
    result.push(data.jok_kulit);
    result.push(data.power_bagasi);

    if(data.central_lock_driver){
        result.push(true);
    }else{
        result.push(false);
    }

    if(data.central_lock_front_passanger){
        result.push(true);
    }else{
        result.push(false);
    }
    
    if(data.central_lock_rear_passanger){
        result.push(true);
    }else{
        result.push(false);
    }

    result.push(data.digital_dashboard);
    result.push(data.heads_up_display);
    result.push(data.touch_screen_display_jumlah);
    result.push(data.touch_screen_display_ukuran);
    result.push(data.number_of_vent_front);
    result.push(data.number_of_vent_rear);
    result.push(data.rear_passanger_tv);
    result.push(data.cool_box);
    result.push(data.vanity_mirror);
    result.push(data.power_window);
    result.push(data.power_seat);
    result.push(data.engine_start_stop);

    if(data.central_lock_adjustable){
        result.push(true);
    }else{
        result.push(false);
    }
    
    if(data.central_lock_cruise_control){
        result.push(true);
    }else{
        result.push(false);
    }

    if(data.central_lock_audio_control){
        result.push(true);
    }else{
        result.push(false);
    }
    
    if(data.central_lock_gearshift_paddle){
        result.push(true);
    }else{
        result.push(false);
    }

    result.push(data.navigation);
    result.push(data.air_conditioner_double_blower);
    result.push(data.air_conditioner_touch_screen_control);
    result.push(data.voice_command_control);
    result.push(data.rear_passanger_controller_interior);
    result.push(data.ambience_lightning);
    result.push(data.folding_table);
    result.push(parent_id);
    return result;
}


app.get("/mobil/detail/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getDataHeader = await pool.query("SELECT a.id as merk_id, a.name as merk,b.id as group_model_id, b.name as group_model, c.id as model_id, c.name as model, t.id as tahun_id, t.tahun as tahun, m.* FROM mobil m left join merk a on m.merk_id = a.id left join group_model b on m.type_id = b.id left join model c on m.model_id = c.id left join tahun t on t.id = m.tahun_id where m.id = $1", [id]);
        let DataHeader = getDataHeader.rows[0];

        let getDataMesin = await pool.query("SELECT * FROM spesifikasi_mesin where mobild_id = $1", [id]);
        let DataMesin = getDataMesin.rows[0];
        let getDataMesinPhoto = await pool.query("SELECT * FROM spesifikasi_mesin_photo where spesifikasi_mesin_id = $1", [DataMesin.id]);
        let DataMesinPhoto = getDataMesinPhoto.rows;


        let getDataPerforma = await pool.query("SELECT * FROM spesifikasi_performa where mobil_id = $1", [id]);
        let DataPerforma = getDataPerforma.rows[0];
        let getDataPerformaPhoto = await pool.query("SELECT * FROM spesifikasi_performa_photo where spesifikasi_performa_id = $1", [DataPerforma.id]);
        let DataPerformaPhoto = getDataPerformaPhoto.rows;

        let getDataDimensi = await pool.query("SELECT * FROM spesifikasi_dimensi where mobil_id = $1", [id]);
        let DataDimensi = getDataDimensi.rows[0];
        let getDataDimensiPhoto = await pool.query("SELECT * FROM spesifikasi_dimensi_photo where spesifikasi_dimensi_id = $1", [DataDimensi.id]);
        let DataDimensiPhoto = getDataDimensiPhoto.rows;

        let getDataEksterior = await pool.query("SELECT * FROM spesifikasi_eksterior where mobil_id = $1", [id]);
        let DataEksterior = getDataEksterior.rows[0];
        let getDataEksteriorPhoto = await pool.query("SELECT * FROM spesifikasi_eksterior_photo where spesifikasi_eksterior_id = $1", [DataEksterior.id]);
        let DataEksteriorPhoto = getDataEksteriorPhoto.rows;

        let getDataInterior = await pool.query("SELECT * FROM spesifikasi_interior where mobil_id = $1", [id]);
        let DataInterior = getDataInterior.rows[0];
        let getDataInteriorPhoto = await pool.query("SELECT * FROM spesifikasi_interior_photo where spesifikasi_interior_id = $1", [DataInterior.id]);
        let DataInteriorPhoto = getDataInteriorPhoto.rows;

        let getDataSafety = await pool.query("SELECT * FROM spesifikasi_safety where mobil_id = $1", [id]);
        let DataSafety = getDataSafety.rows[0];
        let getDataSafetyPhoto = await pool.query("SELECT * FROM spesifikasi_safety_photo where spesifikasi_safety_id = $1", [DataSafety.id]);
        let DataSafetyPhoto = getDataSafetyPhoto.rows;

        let getDataEnteriment = await pool.query("SELECT * FROM spesifikasi_entertaiment where mobil_id = $1", [id]);
        let DataEnteriment = getDataEnteriment.rows[0];
        let getDataEnterimentPhoto = await pool.query("SELECT * FROM spesifikasi_entertaiment_photo where spesifikasi_entertaiment_id = $1", [DataEnteriment.id]);
        let DataEnterimentPhoto = getDataEnterimentPhoto.rows;

        let getDataPhotos = await pool.query("SELECT * FROM spesifikasi_photos where mobil_id = $1", [id]);
        let DataPhotos = getDataPhotos.rows;

        let getDataBerita = await pool.query("SELECT * FROM berita where mobil_id = $1", [id]);
        let DataBerita = getDataBerita.rows[0];

        let getDataVideo = await pool.query("SELECT * FROM video where mobil_id = $1", [id]);
        let DataVideo = getDataVideo.rows[0];

        res.render('mobil/detail', {
            DataHeader:DataHeader,
            DataMesin:DataMesin, 
            DataPerforma:DataPerforma, 
            DataDimensi:DataDimensi, 
            DataEksterior: DataEksterior, 
            DataInterior: DataInterior, 
            DataSafety: DataSafety, 
            DataEnteriment: DataEnteriment, 
            DataPhotos: DataPhotos,
            DataBerita: DataBerita,
            DataVideo: DataVideo,
            DataMesinPhoto:DataMesinPhoto, 
            DataPerformaPhoto:DataPerformaPhoto, 
            DataDimensiPhoto:DataDimensiPhoto, 
            DataEksteriorPhoto: DataEksteriorPhoto, 
            DataInteriorPhoto: DataInteriorPhoto, 
            DataSafetyPhoto: DataSafetyPhoto, 
            DataEnterimentPhoto: DataEnterimentPhoto, });
    } catch (error) {
        res.json(error.message);
    }
});


app.get("/mobil/delete/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const getmodel = await pool.query("DELETE FROM mobil where id = $1", [id]);
        res.redirect('/mobil');
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/mobil", async (req, res) => {
    try {
        let getMerk = await pool.query("SELECT m.id, a.name as merk, b.name as group_model, c.name as model, t.tahun as tahun FROM mobil m left join merk a on m.merk_id = a.id left join group_model b on m.type_id = b.id left join model c on m.model_id = c.id left join tahun t on t.id = m.tahun_id ");
        let data = [];
        for(var i=0; i<getMerk.rows.length; i++){
            data.push(getMerk.rows[i]);
        }
        // res.json(getMerk.rows);
        res.render('mobil/index', {data:data});
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/mobil/edit/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getgroupmodel = await pool.query("SELECT a.id as merk_id, a.name as merk,b.id as group_model_id, b.name as group_model, c.id as model_id, c.name as model, t.id as tahun_id, t.tahun as tahun, m.* FROM mobil m left join merk a on m.merk_id = a.id left join group_model b on m.type_id = b.id left join model c on m.model_id = c.id left join tahun t on t.id = m.tahun_id where m.id = $1", [id]);
        let data = getgroupmodel.rows[0];

        let getMerk = await pool.query("SELECT * FROM merk");
        let dataMerk = [];
        for(var i=0; i<getMerk.rows.length; i++){
            dataMerk.push(getMerk.rows[i]);
        }
        let getGroupModel = await pool.query("SELECT * FROM group_model");
        let dataGroup = [];
        for(var i=0; i<getGroupModel.rows.length; i++){
            dataGroup.push(getGroupModel.rows[i]);
        }
        let getModel = await pool.query("SELECT * FROM model");
        let dataModel = [];
        for(var i=0; i<getModel.rows.length; i++){
            dataModel.push(getModel.rows[i]);
        }

        let getTahun = await pool.query("SELECT * FROM tahun");
        let dataTahun = [];
        for(var i=0; i<getTahun.rows.length; i++){
            dataTahun.push(getTahun.rows[i]);
        }

        let geteksterior = await pool.query("SELECT * FROM spesifikasi_eksterior where mobil_id = $1", [data.id]);
        let getinterior = await pool.query("SELECT * FROM spesifikasi_interior where mobil_id = $1", [data.id]);
        let getdimensi = await pool.query("SELECT * FROM spesifikasi_dimensi where mobil_id = $1", [data.id]);
        let getmesin = await pool.query("SELECT * FROM spesifikasi_mesin where mobild_id = $1", [data.id]);
        let getperforma = await pool.query("SELECT * FROM spesifikasi_performa where mobil_id = $1", [data.id]);
        let getsafety = await pool.query("SELECT * FROM spesifikasi_safety where mobil_id = $1", [data.id]);
        let getentertaiment = await pool.query("SELECT * FROM spesifikasi_entertaiment where mobil_id = $1", [data.id]);
        let getberita = await pool.query("SELECT * FROM berita where mobil_id = $1", [data.id]);
        let getvideo = await pool.query("SELECT * FROM video where mobil_id = $1", [data.id]);

        res.render('mobil/edit', {
            data:data, 
            merk:dataMerk, 
            groupmodel:dataGroup, 
            model:dataModel, 
            tahun: dataTahun,
            eksterior: geteksterior.rows[0],
            interior: getinterior.rows[0],
            dimensi: getdimensi.rows[0],
            mesin: getmesin.rows[0],
            performa: getperforma.rows[0],
            safety: getsafety.rows[0],
            entertaiment: getentertaiment.rows[0],
            berita: getberita.rows[0],
            video: getvideo.rows[0],
        });
        // res.json(getgroupmodel.rows[0]);
    } catch (error) {
        res.json(error.message);
    }
});

app.post("/mobil/edit", async (req, res, next) => {
    try {
        // const { name } = req.params;
        upload(req, res, async function (err){
            if(err){
                console.log("Something gone wrong");
                // return res.send("Something gone wrong");
            }

            var data = req.body;
            var years = getRangeYear(data.from, data.to);
            var parent_id = data.mobil_id;
            var dataHeader = BindDataHeaderEdit(data, data.from);
            const addMobil = await pool.query("UPDATE public.mobil SET merk_id=$1, model_id=$2, type_id=$3, tahun_id=$4 WHERE id = $5 RETURNING *", dataHeader);

            var dataSpesifikasiMesin = BindDataSpesifikasiMesinEdit(data, parent_id);
            var sqlSpesifikasiMesin = "UPDATE public.spesifikasi_mesin SET tipe=$1, kapasitas_tangki=$2, max_torque=$3, valve_per_cylinder=$4, transmisi=$5, clutch=$6, kapasitas_mesin=$7, max_power=$8, cylinder=$9, turbo_charged=$10, gearbox=$11 WHERE  mobild_id=$12 RETURNING *"
            const addSpesifikasiMesin = await pool.query(sqlSpesifikasiMesin, dataSpesifikasiMesin);
            // var mesin_parent_id = addSpesifikasiMesin.rows[0].id;
            // var mesin_photo = req.files.photomesin;
            // if(mesin_photo != null){
            //     for (let index = 0; index < mesin_photo.length; index++) {
            //         const element = mesin_photo[index];
            //         var dataPhotoMesin = [element.filename, mesin_parent_id];
            //         var sqlSpesifikasiMesinPhoto = "INSERT INTO spesifikasi_mesin_photo (file_name, spesifikasi_mesin_id) VALUES ($1, $2) RETURNING *";
            //         const addSpesifikasiMesinPhoto = await pool.query(sqlSpesifikasiMesinPhoto, dataPhotoMesin);
            //     }
            // }

            var dataSpesifikasiPerforma = BindDataSpesifikasiPerformaEdit(data, parent_id);
            var sqlSpesifikasiPerforma = "UPDATE public.spesifikasi_performa SET akselerasi=$1, mile=$2, tipe_bahan_bakar=$3, konsumsi_bahan_bakar_tol=$4, top_speed=$5, braking=$6, konsumsi_bahan_bakar_normal=$7 WHERE mobil_id = $8 RETURNING *"
            const addSpesifikasiPerforma = await pool.query(sqlSpesifikasiPerforma, dataSpesifikasiPerforma);
            // var performa_parent_id = addSpesifikasiPerforma.rows[0].id;
            // var performa_photo = req.files.photoperforma;
            // if(performa_photo != null){
            //     for (let index = 0; index < performa_photo.length; index++) {
            //         const element = performa_photo[index];
            //         var dataPhotoperforma = [element.filename, performa_parent_id];
            //         var sqlSpesifikasiperformaPhoto = "INSERT INTO spesifikasi_performa_photo (file_name, spesifikasi_performa_id) VALUES ($1, $2) RETURNING *";
            //         const addSpesifikasiperformaPhoto = await pool.query(sqlSpesifikasiperformaPhoto, dataPhotoperforma);
            //     }
            // }

            var dataSpesifikasiDimensi = BindDataSpesifikasiDimensiEdit(data, parent_id);
            var sqlSpesifikasiDimensi = "UPDATE public.spesifikasi_dimensi SET lxwxhx=$1, wheel_base=$2, kapasitas_bagasi=$3, ground_clearance=$4, kapasitas_penumpang=$5, jumlah_pintu=$6 WHERE mobil_id=$7 RETURNING *"
            const addSpesifikasiDimensi = await pool.query(sqlSpesifikasiDimensi, dataSpesifikasiDimensi);
            // var dimensi_parent_id = addSpesifikasiDimensi.rows[0].id;
            // var dimensi_photo = req.files.photodimensi;
            // if(dimensi_photo != null){
            //     for (let index = 0; index < dimensi_photo.length; index++) {
            //         const element = dimensi_photo[index];
            //         var dataPhotodimensi = [element.filename, dimensi_parent_id];
            //         var sqlSpesifikasidimensiPhoto = "INSERT INTO spesifikasi_dimensi_photo (file_name, spesifikasi_dimensi_id) VALUES ($1, $2) RETURNING *";
            //         const addSpesifikasidimensiPhoto = await pool.query(sqlSpesifikasidimensiPhoto, dataPhotodimensi);
            //     }
            // }

            var dataSpesifikasiEksterior = BindDataSpesifikasiEksteriorEdit(data, parent_id);
            var sqlSpesifikasiEksterior = "UPDATE public.spesifikasi_eksterior SET warna=$1, spion_electric=$2, spion_folding=$3, spion_lampu_signal=$4, fog_lamp=$5, door_handle=$6, keyless_entry_pintu_penumpang=$7, keyless_entry_bagasi=$8, sun_roof=$9, tipe_cat=$10, head_light=$11, tail_light=$12, signal_light=$13, door_soft_close=$14, parking_sensor=$15, bentuk_knalpot=$16 WHERE mobil_id=$17 RETURNING *"
            const addSpesifikasiEksterior = await pool.query(sqlSpesifikasiEksterior, dataSpesifikasiEksterior);
            // var eksterior_parent_id = addSpesifikasiEksterior.rows[0].id;
            // var eksterior_photo = req.files.photoeksterior;
            // if(eksterior_photo != null){
            //     for (let index = 0; index < eksterior_photo.length; index++) {
            //         const element = eksterior_photo[index];
            //         var dataPhotoeksterior = [element.filename, eksterior_parent_id];
            //         var sqlSpesifikasieksteriorPhoto = "INSERT INTO spesifikasi_eksterior_photo (file_name, spesifikasi_eksterior_id) VALUES ($1, $2) RETURNING *";
            //         const addSpesifikasieksteriorPhoto = await pool.query(sqlSpesifikasieksteriorPhoto, dataPhotoeksterior);
            //     }
            // }

            var dataSpesifikasiInterior = BindDataSpesifikasiInterior(data, parent_id);
            var sqlSpesifikasiInterior = "UPDATE public.spesifikasi_interior SET jok_kulit=$1, power_bagasi=$2, central_lock_driver=$3, central_lock_front_passanger=$4, central_lock_rear_passanger=$5, digital_dashboard=$6, heads_up_display=$7, touch_screen_display_jumlah=$8, touch_screen_display_ukuran=$9, number_of_vent_front=$10, number_of_vent_rear=$11, rear_passanger_tv=$12, cool_box=$13, vanity_mirror=$14, power_window=$15, power_seat=$16, engine_start_stop=$17, central_lock_adjustable=$18, central_lock_cruise_control=$19, central_lock_audio_control=$20, central_lock_gearshift_paddle=$21, navigation=$22, air_conditioner_double_blower=$23, air_conditioner_touch_screen_control=$24, voice_command_control=$25, rear_passanger_controller=$26, ambience_lightning=$27, folding_table=$28 WHERE mobil_id=$29 RETURNING *"
            const addSpesifikasiInterior = await pool.query(sqlSpesifikasiInterior, dataSpesifikasiInterior);
            // var interior_parent_id = addSpesifikasiInterior.rows[0].id;
            // var interior_photo = req.files.photointerior;
            // if(interior_photo != null){
            //     for (let index = 0; index < interior_photo.length; index++) {
            //         const element = interior_photo[index];
            //         var dataPhotointerior = [element.filename, interior_parent_id];
            //         var sqlSpesifikasiinteriorPhoto = "INSERT INTO spesifikasi_interior_photo (file_name, spesifikasi_interior_id) VALUES ($1, $2) RETURNING *";
            //         const addSpesifikasiinteriorPhoto = await pool.query(sqlSpesifikasiinteriorPhoto, dataPhotointerior);
            //     }
            // }

            var dataSpesifikasiEntertaiment = BindDataSpesifikasiEntertaiment(data, parent_id);
            var sqlSpesifikasiEntertaiment = "UPDATE public.spesifikasi_entertaiment SET usb_and_aux=$1, bluetooth=$2, android_auto=$3, apple_car_play=$4, speaker_brand=$5, speaker_front=$6, speaker_rear=$7, radio_cd_dvd=$8, rear_tv_display=$9, rear_passanger_controller=$10 WHERE mobil_id=$11 RETURNING *";
            const addSpesifikasiEntertaiment = await pool.query(sqlSpesifikasiEntertaiment, dataSpesifikasiEntertaiment);
            // var entertaiment_parent_id = addSpesifikasiEntertaiment.rows[0].id;
            // var entertaiment_photo = req.files.photoentertaiment;
            // if(entertaiment_photo != null){
            //     for (let index = 0; index < entertaiment_photo.length; index++) {
            //         const element = entertaiment_photo[index];
            //         var dataPhotoentertaiment = [element.filename, entertaiment_parent_id];
            //         var sqlSpesifikasientertaimentPhoto = "INSERT INTO spesifikasi_entertaiment_photo (file_name, spesifikasi_entertaiment_id) VALUES ($1, $2) RETURNING *";
            //         const addSpesifikasientertaimentPhoto = await pool.query(sqlSpesifikasientertaimentPhoto, dataPhotoentertaiment);
            //     }
            // }

            var dataSpesifikasiSafety = BindDataSpesifikasiSafetyEdit(data, parent_id);
            var sqlSpesifikasiSafety = "UPDATE public.spesifikasi_safety SET seat_belts=$1, airbag_driver=$2, airbag_front_passanger=$3, airbag_rear_passanger=$4, electronic_stability_control=$5, rear_cross_traffic_control=$6, forward_collision_warning=$7, blind_spot_warning=$8, night_vision=$9, engine_immobilizer=$10, seat_belts_reminder=$11, child_safety_lock=$12, abs=$13, automatic_emergency_brake=$14, adaptive_cruise_control=$15, lane_departure_warning_and_assist=$16, autonomus_driving=$17, anti_thef_alarm=$18, crash_test_rating=$19 WHERE mobil_id=$20 RETURNING *";
            const addSpesifikasiSafety = await pool.query(sqlSpesifikasiSafety, dataSpesifikasiSafety);
            // var safety_parent_id = addSpesifikasiSafety.rows[0].id;
            // var safety_photo = req.files.photosafety;
            // if(safety_photo != null){
            //     for (let index = 0; index < safety_photo.length; index++) {
            //         const element = safety_photo[index];
            //         var dataPhotosafety = [element.filename, safety_parent_id];
            //         var sqlSpesifikasisafetyPhoto = "INSERT INTO spesifikasi_safety_photo (file_name, spesifikasi_safety_id) VALUES ($1, $2) RETURNING *";
            //         const addSpesifikasisafetyPhoto = await pool.query(sqlSpesifikasisafetyPhoto, dataPhotosafety);
            //     }
            // }

            // var files = req.files.photoutama;
            // if(files != null){
            //     for (let index = 0; index < files.length; index++) {
            //         const element = files[index];
            //         var dataPhotos = [parent_id, element.filename];
            //         var sqlSpesifikasiPhotos = "INSERT INTO public.spesifikasi_photos (mobil_id, file_name) VALUES ($1, $2) RETURNING *";
            //         const addSpesifikasiPhotos = await pool.query(sqlSpesifikasiPhotos, dataPhotos);
            //     }
            // }

            // var berita = req.files.imgBerita;
            // if(berita != null){
            //     for (let index = 0; index < berita.length; index++) {
            //         const element = berita[index];
            //         var dataBerita = [element.filename, data.headline_berita, data.link_berita, parent_id];
            //         var sqlSpesifikasiBerita = "INSERT INTO berita (file_name, headline, link, mobil_id) VALUES ($1, $2, $3, $4) RETURNING *";
            //         const addSpesifikasiBerita = await pool.query(sqlSpesifikasiBerita, dataBerita);
            //     }
            // }

            // var video = req.files.videoFile;
            // if(video != null){
            //     for (let index = 0; index < video.length; index++) {
            //         const element = video[index];
            //         var dataVideo = [parent_id, element.filename, data.headline_video, data.link_video];
            //         var sqlSpesifikasiVideo = "INSERT INTO public.video (mobil_id, file_name, headline_video, link_video) VALUES ($1, $2, $3, $4) RETURNING *";
            //         const addSpesifikasiVideo = await pool.query(sqlSpesifikasiVideo, dataVideo);
            //     }
            // }else{
            //     var dataVideo = [parent_id, data.headline_video, data.link_video];
            //     var sqlSpesifikasiVideo = "INSERT INTO public.video (mobil_id, headline_video, link_video) VALUES ($1, $2, $3) RETURNING *";
            //     const addSpesifikasiVideo = await pool.query(sqlSpesifikasiVideo, dataVideo);
            // }

            res.redirect('/mobil/detail/' + parent_id);
        });

       
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/mobil/copy/", async (req, res) => {
    try {
        const { merk, groupmodel, model } = req.query;
        let datamobil = await pool.query("select * from mobil where merk_id = $1 and type_id = $2 and model_id = $3", [merk, groupmodel, model]);
        if(datamobil.rows <= 0) return res.redirect('/mobil/create');
        let dataCopyMobil = datamobil.rows[0];

        var id = dataCopyMobil.id;
        let getgroupmodel = await pool.query("SELECT a.id as merk_id, a.name as merk,b.id as group_model_id, b.name as group_model, c.id as model_id, c.name as model, t.id as tahun_id, t.tahun as tahun, m.* FROM mobil m left join merk a on m.merk_id = a.id left join group_model b on m.type_id = b.id left join model c on m.model_id = c.id left join tahun t on t.id = m.tahun_id where m.id = $1", [id]);
        let data = getgroupmodel.rows[0];

        let getMerk = await pool.query("SELECT * FROM merk");
        let dataMerk = [];
        for(var i=0; i<getMerk.rows.length; i++){
            dataMerk.push(getMerk.rows[i]);
        }
        let getGroupModel = await pool.query("SELECT * FROM group_model");
        let dataGroup = [];
        for(var i=0; i<getGroupModel.rows.length; i++){
            dataGroup.push(getGroupModel.rows[i]);
        }
        let getModel = await pool.query("SELECT * FROM model");
        let dataModel = [];
        for(var i=0; i<getModel.rows.length; i++){
            dataModel.push(getModel.rows[i]);
        }

        let getTahun = await pool.query("SELECT * FROM tahun");
        let dataTahun = [];
        for(var i=0; i<getTahun.rows.length; i++){
            dataTahun.push(getTahun.rows[i]);
        }

        let geteksterior = await pool.query("SELECT * FROM spesifikasi_eksterior where mobil_id = $1", [data.id]);
        let getinterior = await pool.query("SELECT * FROM spesifikasi_interior where mobil_id = $1", [data.id]);
        let getdimensi = await pool.query("SELECT * FROM spesifikasi_dimensi where mobil_id = $1", [data.id]);
        let getmesin = await pool.query("SELECT * FROM spesifikasi_mesin where mobild_id = $1", [data.id]);
        let getperforma = await pool.query("SELECT * FROM spesifikasi_performa where mobil_id = $1", [data.id]);
        let getsafety = await pool.query("SELECT * FROM spesifikasi_safety where mobil_id = $1", [data.id]);
        let getentertaiment = await pool.query("SELECT * FROM spesifikasi_entertaiment where mobil_id = $1", [data.id]);
        let getberita = await pool.query("SELECT * FROM berita where mobil_id = $1", [data.id]);
        let getvideo = await pool.query("SELECT * FROM video where mobil_id = $1", [data.id]);

        res.render('mobil/copy', {
            data:data, 
            merk:dataMerk, 
            groupmodel:dataGroup, 
            model:dataModel, 
            tahun: dataTahun,
            eksterior: geteksterior.rows[0],
            interior: getinterior.rows[0],
            dimensi: getdimensi.rows[0],
            mesin: getmesin.rows[0],
            performa: getperforma.rows[0],
            safety: getsafety.rows[0],
            entertaiment: getentertaiment.rows[0],
            berita: getberita.rows[0],
            video: getvideo.rows[0],
        });
        // res.json(getgroupmodel.rows[0]);
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/api/mobils", async (req, res) => {
    try {
        let getMobil = await pool.query("SELECT m.id, a.name as merk, b.name as group_model, c.name as model, t.tahun as tahun FROM mobil m left join merk a on m.merk_id = a.id left join group_model b on m.model_id = b.id left join model c on m.model_id = c.id left join tahun t on t.id = m.tahun_id ");
        let data = [];
        for(var i=0; i<getMobil.rows.length; i++){
            data.push(getMobil.rows[i]);
        }
        res.json(getMobil.rows);
        // res.render('merk/merk', {data:data});
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/api/mobil/:id", async (req, res) => {
    try {
        const { id } = req.params;

        let getMobil = await pool.query("SELECT m.id, a.name as merk, b.name as group_model, c.name as model, t.tahun as tahun FROM mobil m left join merk a on m.merk_id = a.id left join group_model b on m.type_id = b.id left join model c on m.model_id = c.id left join tahun t on t.id = m.tahun_id where m.id = $1", [id]);
        let data = [];
        for(var i=0; i<getMobil.rows.length; i++){
            data.push(getMobil.rows[i]);
        }
        res.json(getMobil.rows[0]);
        // res.render('merk/merk', {data:data});
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/api/mesin/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getMobil = await pool.query("Select * from spesifikasi_mesin where mobild_id = $1", [id]);
        let data = [];
        for(var i=0; i<getMobil.rows.length; i++){
            data.push(getMobil.rows[i]);
        }
        res.json(getMobil.rows[0]);
        // res.render('merk/merk', {data:data});
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/api/performa/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getMobil = await pool.query("Select * from spesifikasi_performa where mobil_id = $1", [id]);
        let data = [];
        for(var i=0; i<getMobil.rows.length; i++){
            data.push(getMobil.rows[i]);
        }
        res.json(getMobil.rows[0]);
        // res.render('merk/merk', {data:data});
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/api/dimensi/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getMobil = await pool.query("Select * from spesifikasi_dimensi where mobil_id = $1", [id]);
        let data = [];
        for(var i=0; i<getMobil.rows.length; i++){
            data.push(getMobil.rows[i]);
        }
        res.json(getMobil.rows[0]);
        // res.render('merk/merk', {data:data});
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/api/eksterior/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getMobil = await pool.query("Select * from spesifikasi_eksterior where mobil_id = $1", [id]);
        let data = [];
        for(var i=0; i<getMobil.rows.length; i++){
            data.push(getMobil.rows[i]);
        }
        res.json(getMobil.rows[0]);
        // res.render('merk/merk', {data:data});
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/api/interior/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getMobil = await pool.query("Select * from spesifikasi_interior where mobil_id = $1", [id]);
        let data = [];
        for(var i=0; i<getMobil.rows.length; i++){
            data.push(getMobil.rows[i]);
        }
        res.json(getMobil.rows[0]);
        // res.render('merk/merk', {data:data});
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/api/safety/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getMobil = await pool.query("Select * from spesifikasi_safety where mobil_id = $1", [id]);
        let data = [];
        for(var i=0; i<getMobil.rows.length; i++){
            data.push(getMobil.rows[i]);
        }
        res.json(getMobil.rows[0]);
        // res.render('merk/merk', {data:data});
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/api/entertaiment/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getMobil = await pool.query("Select * from spesifikasi_entertaiment where mobil_id = $1", [id]);
        let data = [];
        for(var i=0; i<getMobil.rows.length; i++){
            data.push(getMobil.rows[i]);
        }
        res.json(getMobil.rows[0]);
        // res.render('merk/merk', {data:data});
    } catch (error) {
        res.json(error.message);
    }
});

// app.get("/api/berita/:id", async (req, res) => {
//     try {
//         const { id } = req.params;
//         let getBerita = await pool.query("Select * from berita where mobil_id = $1", [id]);
//         res.json(getBerita.rows[0]);
//     } catch (error) {
//         res.json(error.message);
//     }
// });

app.get("/api/eksteriorphoto/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getEksterior = await pool.query("Select * from spesifikasi_eksterior where mobil_id = $1", [id]);
        let objEksterior = getEksterior.rows[0];

        let getPhotos = await pool.query("Select * from spesifikasi_eksterior_photo where spesifikasi_eksterior_id = $1", [objEksterior.id]);
        res.json(getPhotos.rows);
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/api/interiorphoto/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getInterior = await pool.query("Select * from spesifikasi_interior where mobil_id = $1", [id]);
        let objInterior = getInterior.rows[0];

        let getPhotos = await pool.query("Select * from spesifikasi_interior_photo where spesifikasi_interior_id = $1", [objInterior.id]);
        res.json(getPhotos.rows);
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/api/dimensiphoto/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getDimensi = await pool.query("Select * from spesifikasi_dimensi where mobil_id = $1", [id]);
        let objDimensi = getDimensi.rows[0];

        let getPhotos = await pool.query("Select * from spesifikasi_dimensi_photo where spesifikasi_dimensi_id = $1", [objDimensi.id]);
        res.json(getPhotos.rows);
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/api/mesinphoto/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getMesin = await pool.query("Select * from spesifikasi_mesin where mobild_id = $1", [id]);
        let objMesin = getMesin.rows[0];

        let getPhotos = await pool.query("Select * from spesifikasi_mesin_photo where spesifikasi_mesin_id = $1", [objMesin.id]);
        res.json(getPhotos.rows);
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/api/performaphoto/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getPerforma = await pool.query("Select * from spesifikasi_performa where mobil_id = $1", [id]);
        let objPerforma = getPerforma.rows[0];

        let getPhotos = await pool.query("Select * from spesifikasi_performa_photo where spesifikasi_performa_id = $1", [objPerforma.id]);
        res.json(getPhotos.rows);
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/api/safetyphoto/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getSafety = await pool.query("Select * from spesifikasi_safety where mobil_id = $1", [id]);
        let objSafety = getSafety.rows[0];
        let getPhotos = await pool.query("Select * from spesifikasi_safety_photo where spesifikasi_safety_id = $1", [objSafety.id]);
        res.json(getPhotos.rows);
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/api/entertaimentphoto/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getEntertaiment = await pool.query("Select * from spesifikasi_entertaiment where mobil_id = $1", [id]);
        let objEntertaiment = getEntertaiment.rows[0];
        let getPhotos = await pool.query("Select * from spesifikasi_entertaiment_photo where spesifikasi_entertaiment_id = $1", [objEntertaiment.id]);
        res.json(getPhotos.rows);
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/api/berita/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getEntertaiment = await pool.query("Select * from berita where mobil_id = $1", [id]);
        let objEntertaiment = getEntertaiment.rows;
        console.log(objEntertaiment);
        res.json(objEntertaiment);
    } catch (error) {
        res.json(error.message);
    }
});

app.get("/api/video/:id", async (req, res) => {
    try {
        const { id } = req.params;
        let getEntertaiment = await pool.query("Select * from video where mobil_id = $1", [id]);
        let objEntertaiment = getEntertaiment.rows[0];
        res.json(objEntertaiment);
    } catch (error) {
        res.json(error.message);
    }
});



app.listen(5000, () =>{
    console.log("server has port 5000");
});