const express = require('express');
const ldap = require('ldapjs');
const CONFIG = require('./config.js')
const passport = require('passport');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session')
const session = require('express-session');
const PassportLocal = require('passport-local').Strategy;
const CustomStrategy = require('passport-custom').Strategy


// INSTANCIA DE EXPRESS
const app = express();

// MOTOR DE VISTA
app.set('view engine', 'ejs');


// CREACION DE LA SESSION SEGUN RESULTADO DE AUTENTICACION
passport.use('ldap', new CustomStrategy(async function (req, done) {
    try {
        if (! req.body.username || ! req.body.password) {
            throw new Error('Usuario y contraseña no proporcionados')
        }

        // VALIDACION EN EL SERVIDOR LDAP
        let username = "uid=" + req.body.username + "," + CONFIG.ldap.dn;
        const user = await authenticateDN(username, req.body.password)
        
        // AUTENTICACION EXITOSA
        done(null, user)
    } catch (error) { 
        // AUTENTICACION FALLIDA
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


//PROCESO DE SERIALIZACION DEL RESULTADO DE LA AUTENTICACION
passport.serializeUser(function (user, done) {
    done(null, user);
})
passport.deserializeUser(function (user, done) {
    done(null, user);
})


// URL DEL SERVIDOR LDAP
const client = ldap.createClient({url: CONFIG.ldap.url});

// CREACION DE CONEXION A LDAP CON LOS PARAMETROS PASADOS POR LA VISTA LOGIN
function authenticateDN(username, password) { 
  return client.bind(username, password, function (err) {
        if (err) {
            console.log("Error in new connetion " + err)
            return false;
        } else { 
            console.log(" Connection success");
            return true;
        }
    });
}

// REDIRECCION A PANEL DE CONTROL + VALIDACION DE EXISTENCIA DE AUTENTICACION
app.get("/adm", (req, res, next) => {
    if (req.isAuthenticated()) 
        return next();
     else 
        res.redirect("/adm/login")
}, (req, res) => {
    res.render("adm");
});

// REDIRECCION A FORMULARIO DE LOGUEO + VALIDACION DE EXISTENCIA DE AUTENTICACION
app.get("/adm/login", (req, res, next) => {
    if (!req.isAuthenticated()) 
        return next();
     else 
        res.redirect("/adm")
}, (req, res) => {
    res.render("login");
});

//ACCION DE VERIFICACION DE LA AUTENTICACION Y REDIRECCION
app.post("/adm/login", passport.authenticate('ldap', {
    successRedirect: "/adm",
    failureRedirect: "/adm/login"
}));

// CERRAR LA SESION DE LDAP SEGUN RESULTADO DE AUTENTICACION
app.get("/adm/logout", function (req, res) {
    req.logOut();
    res.redirect("/adm/login");
});

//ASIGNACION DE PUERTO AL SERVIDOR
app.listen(8002, () => console.log("Ya está corriendo, ya no lo toques más puerto 8002"));
