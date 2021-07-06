const express = require('express');
const ldap = require('ldapjs');
const CONFIG = require('./config.js')
const passport = require('passport');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session')
const session = require('express-session');
const PassportLocal = require('passport-local').Strategy;
const CustomStrategy = require('passport-custom').Strategy
const md5 =require("md5");


// INSTANCIA DE EXPRESS
const app = express();

// MOTOR DE VISTA
app.set('view engine', 'ejs');

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
    cargarCuentas();
 
});

// REDIRECCION A FORMULARIO DE LOGUEO + VALIDACION DE EXISTENCIA DE AUTENTICACION
app.get("/adm/login", (req, res, next) => {
    if (!req.isAuthenticated()) 
        return next();
     else 
        res.redirect("/adm")
        cargarCuentas();d


    

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
    res.redirect("/adm/login");
});

// **************************************FIN CONFIGURACION PARA CREAR LA SESION********************************************//


// **********************************CONFIGURACION PARA CREAR CUENTAS DE CORREO********************************************//

function crearCuenta(name, mail,lastname,password) {
            // VALIDACION EN EL SERVIDOR LDAP
            let username = "uid=" + "enchiladas" + "," + CONFIG.ldap.dn;
            // CREACION DE CONEXION A LDAP CON LOS PARAMETROS PASADOS POR LA VISTA LOGIN
            client.bind(username, "enchiladas", function (err) {
                if (err) { // AUTENTICACION FALLIDA
                    console.log("Error in new connetion " + err)
                    
    
                } else { // AUTENTICACION EXITOSA
                    console.log(" Connection success");
                    let dominio="enchiladas";
                    const entry = {
                        cn: name,
                        homeDirectory: "/home/vmail/"+dominio+"/"+name +"."+ lastname,
                        mail: mail,
                        ObjectClass: ['inetOrgPerson','organizationalPerson','CourierMailAccount','person','top'],
                        sn: lastname,
                        mailbox: dominio+"/"+name +"."+ lastname,
                        userPassword:  md5(password)
                    };
                    //let nombreconcat = name +"."+ lastname;
                    client.add(('uid='+name +"."+ lastname+',ou='+dominio+',ou=sistemas,dc=enchiladas,dc=com'), entry, (err) => {
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


function cargarCuentas() {
    const opts = {
        scope: 'sub',
        attributes: ['sn', 'cn']
    };

    client.search(CONFIG.ldap.dn2, opts, (err, res) => {
        
if (err) {
            console.log("Error in search " + err)
        } else {
            res.on('searchEntry', function (entry) {
                console.log('entry: ' + JSON.stringify(entry.object));
            });
            res.on('searchReference', function (referral) {
                console.log('referral: ' + referral.uris.join());
            });
            res.on('error', function (err) {
                console.error('error: ' + err.message);
            });
            res.on('end', function (result) {
                console.log('status: ' + result.status);
            });
        }
    });
}



// ****************************** FIN CONFIGURACION PARA CREAR CUENTAS DE CORREO*******************************************//


// ASIGNACION DE PUERTO AL SERVIDOR
app.listen(8001, () => console.log("Ya está corriendo, ya no lo toques más puerto 8001"));
