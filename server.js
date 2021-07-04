const express = require('express');
const passport = require('passport');
// MODULOS PARA QUE EXPRESS MANEJE SESIONES
const cookieParser = require('cookie-parser');
const session = require('express-session');
const PassportLocal = require('passport-local').Strategy;

// LIBRERIA DE MANEJADORES DE PETICIONES HTTP
const app = express();

app.use(express.urlencoded({extended: true}));
app.use(cookieParser('secretWords'));
app.use(session({secret: 'secretWords', resave: true, saveUninitialized: true}));
app.use(passport.initialize());
4
app.use(passport.session());

passport.use(new PassportLocal(function (username, password, done) {

    if (username === "admin" && password === "admin") 
        return done(null, {
            id: 1,
            name: "Administrador"
        });
    
    done(null, false);
}));

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    done(null, {
        id: 1,
        name: "Administrador"
    });
});


// MOTOR DE VISTA
app.set('view engine', 'ejs');


// VALIDACION DE LOGUEO

app.get("/adm", (req, res, next) => {
    if (req.isAuthenticated()) 
        return next();
    res.redirect("/adm/login")
}, (req, res) => {
    res.render("adm");
});

// FORMULARIO DE LOGUEO
app.get("/adm/login", (req, res, next) => {
    if (!req.isAuthenticated()) 
        return next();
    res.redirect("/adm")
}, (req, res) => {
    res.render("login");
});

// RECIBIR CREDENCIALES E INICIAR SESION
app.post("/adm/login", passport.authenticate('local', {
    successRedirect: "/adm",
    failureRedirect: "/adm/login"
}));
app.listen(8000, () => console.log("Server started"));
