// IMPORTACION DE MODULOS NECESARIOS
const express = require('express');
const passport = require('passport');
const CONFIG = require('./config.js')
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session')
const session = require('express-session');
const PassportLocal = require('passport-local').Strategy;
const CustomStrategy = require('passport-custom').Strategy
const {authenticate} = require('ldap-authentication');

// LIBRERIA DE MANEJADORES DE PETICIONES HTTP
const app = express();

// CREACION DE PETICION A LDAP
passport.use('ldap', new CustomStrategy(async function (req, done) {
    try {
        if (! req.body.username || ! req.body.password) {
            throw new Error('Usuario y contraseña no proporcionados')
        }
        let ldapBaseDn = CONFIG.ldap.dn
        let options = {
            ldapOpts: {
                url: CONFIG.ldap.url
            },
            userDn: `uid=${
                req.body.username
            },${ldapBaseDn}`,
            userPassword: req.body.password,
            userSearchBase: ldapBaseDn,
            usernameAttribute: 'uid',
            username: req.body.username
        }
        // VALIDACION EN EL SERVIDOR LDAP
        let user = await authenticate(options)
        // AUTENTICACION EXITOSA
        done(null, user)
    } catch (error) { // AUTENTICACION FALLIDA
        done(null, null)

    }
}));

// DETALLES DE LAS COOKIES EN SESION
var sessionMiddleWare = cookieSession({
    name: 'session',
    keys: ['Manten el secreto solo para ti'],
    maxAge: 60 * 60 * 1000 // 1 hora
})

// OPCIONES ESPECIALES PARA EL FUNCIONAMIENTO DE PASSPORT
app.use(express.urlencoded({extended: true}));
app.use(sessionMiddleWare);
app.use(cookieParser('secretWords'));
app.use(session({secret: 'secretWords', resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser(function (user, done) {
    done(null, user);
})
passport.deserializeUser(function (user, done) {
    done(null, user);
})

// MOTOR DE VISTA
app.set('view engine', 'ejs');


// REDIRECCIONAMIENTO SEGUN RESULTADO DE AUTENTICACION
app.post("/adm/login", passport.authenticate('ldap', {
    successRedirect: "/adm",
    failureRedirect: "/adm/login"
}));

// VALIDACION DE LOGUEO
app.get("/adm", (req, res, next) => {
    if (req.isAuthenticated()) 
        return next();
     else 
        res.redirect("/adm/login")
}, (req, res) => {
    res.render("adm");
});

// FORMULARIO DE LOGUEO
app.get("/adm/login", (req, res, next) => {
    if (!req.isAuthenticated()) 
        return next();
     else 
        res.redirect("/adm")
}, (req, res) => {
    res.render("login");
});

// CERRAR LA SESION DE LDAP
app.get("/adm/logout", function (req, res) {
    req.logOut();
    res.redirect("/adm/login"); 
});

//ASIGNANDO UN PUERTO AL SERVIDOR
app.listen(8000, () => console.log("Ya está corriendo, ya no lo toques más"));
