const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session');
const app = express();

app.use(express.static(path.join(__dirname, 'public')));

const mongoURI = 'mongodb+srv://clicmarochoaf26_db_user:31004460@cluster0.gr6q6rr.mongodb.net/concesionario?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(mongoURI)
    .then(() => console.log('✅ ✅ ✅ DUCATI CONNECTED'))
    .catch(err => console.log('❌ Error:', err));


app.use(session({
    secret: 'ducati_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

const indexRoutes = require('./routes/index');
app.use('/', indexRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor Ducati corriendo en http://localhost:${PORT}`);
});