const express = require('express');
const ldap = require('ldapjs');
const CONFIG = require('./config.js')
const passport = require('passport');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session')
const session = require('express-session');
const PassportLocal = require('passport-local').Strategy;
const CustomStrategy = require('passport-custom').Strategy
const md5 = require("md5");


// INSTANCIA DE EXPRESS
const app = express();

// MOTOR DE VISTA
app.set('view engine', 'ejs');
app.set('views', __dirname +'/views');
app.use(express.static(__dirname + "/public"));

// *********************************CONFIGURACION PARA CREAR LA SESION***********************************************//

// URL DEL SERVIDOR LDAP
const client = ldap.createClient({url: CONFIG.ldap.url});


// CREACION DE LA SESSION SEGUN RESULTADO DE AUTENTICACION
passport.use('ldap', new CustomStrategy(async function (req, done) {
    try {
        if (! req.body.username || ! req.body.password) {
            throw new Error('Usuario y contraseña no proporcionados')
        }

        // VALIDACION EN EL SERVIDOR LDAP
        let username = "uid=" + req.body.username + "," + CONFIG.ldap.dn;
        // CREACION DE CONEXION A LDAP CON LOS PARAMETROS PASADOS POR LA VISTA LOGIN
        client.bind(username, req.body.password, function (err) {
            if (err) { // AUTENTICACION FALLIDA
                console.log("Error in new connetion " + err)
                done(null, null)

            } else { // AUTENTICACION EXITOSA
                console.log(" Connection success");
                process.env.USERNAME = req.body.username;
                process.env.PASSN = req.body.password;
                done(null, 1)
            }
        });


    } catch (error) {
        console.log(error)
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


// PROCESO DE SERIALIZACION DEL RESULTADO DE LA AUTENTICACION
passport.serializeUser(function (user, done) {
    done(null, user);
})
passport.deserializeUser(function (user, done) {
    done(null, user);
})


// REDIRECCION A PANEL DE CONTROL + VALIDACION DE EXISTENCIA DE AUTENTICACION
app.get("/adm", (req, res, next) => {
    if (req.isAuthenticated()) 
        return next();
     else 
        res.redirect("/adm/login")

    

}, (req, res) => {
    res.render("adm");
    var arrayDeCadenas = req.get('host').split(".");
    var FQDN = arrayDeCadenas[1];
    console.log("Este es el fqdn " + FQDN);
    process.env.HOST = req.get('host').split(".");
});

// REDIRECCION A FORMULARIO DE LOGUEO + VALIDACION DE EXISTENCIA DE AUTENTICACION
app.get("/adm/login", (req, res, next) => {
    if (!req.isAuthenticated()) 
        return next();
     else 
        res.redirect("/adm");
    
    var arrayDeCadenas = req.get('host').split(".");
    var FQDN = arrayDeCadenas[1];
    console.log("Este es el fqdn " + FQDN);
    process.env.HOST = req.get('host').split(".");

}, (req, res) => {
    res.render("login");
});

// ACCION DE VERIFICACION DE LA AUTENTICACION Y REDIRECCION
app.post("/adm/login", passport.authenticate('ldap', {
    successRedirect: "/adm",
    failureRedirect: "/adm/login"
}));

// CERRAR LA SESION DE LDAP SEGUN RESULTADO DE AUTENTICACION
app.get("/adm/logout", function (req, res) {
    req.logOut();
    process.env.USERNAME = "";
    process.env.PASSN = "";
    res.redirect("/adm/login");
});

// **************************************FIN CONFIGURACION PARA CREAR LA SESION********************************************//


// **********************************CONFIGURACION PARA CREAR CUENTAS DE CORREO********************************************//

function crearCuenta(name, mail, lastname, password) { // VALIDACION EN EL SERVIDOR LDAP
    let username = "uid=" + process.env.USERNAME + "," + CONFIG.ldap.dn;
    // CREACION DE CONEXION A LDAP CON LOS PARAMETROS PASADOS POR LA VISTA LOGIN
    client.bind(username, process.env.PASSN, function (err) {
        if (err) { // AUTENTICACION FALLIDA
            console.log("Error in new connetion " + err)


        } else { // AUTENTICACION EXITOSA
            console.log(" Connection success");
            var arrayDeCadenas = process.env.HOST;
            console.log(arrayDeCadenas);
            var FQDN = arrayDeCadenas[1];
            console.log("Este es el fqdn " + FQDN);

            if (FQDN == "yuca") {
                concat = CONFIG.ldap.dn2;
            } else {
                concat = CONFIG.ldap.dn3;
            }
            const entry = {
                cn: name,
                homeDirectory: "/home/vmail/" + FQDN + "/" + name + "." + lastname,
                mail: mail,
                ObjectClass: [
                    'inetOrgPerson',
                    'organizationalPerson',
                    'CourierMailAccount',
                    'person',
                    'top'
                ],
                sn: lastname,
                mailbox: FQDN + "/" + name + "." + lastname,
                userPassword: md5(password)
            };
            client.add(('uid=' + name + "." + lastname + "," + concat), entry, (err) => {
                if (err) {
                    console.log("err in new user " + err);
                } else {
                    console.log("added user")
                }
            });
        }
    });
}

app.post("/adm", function (req, res) {
    crearCuenta(req.body.name, req.body.emailAccount, req.body.lastname, req.body.password2)
    res.redirect("/adm");
});
// **************************************FIN CONFIGURACION PARA CREAR LA CUENTAS********************************************//

//RENDERIZACION PAGINA 404
app.use((req, res, next) =>{
    res.status(404).render("404");
})

// ASIGNACION DE PUERTO AL SERVIDOR
app.listen(5000, () => console.log("Ya está corriendo, ya no lo toques más, puerto 8001"));