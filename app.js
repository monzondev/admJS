const {config} = require('dotenv');
const express = require('express');
const ldap = require('ldapjs');
const CONFIG = require('./config.js')

const passport = require('passport');
const cookieParser = require('cookie-parser');
const cookieSession = require('cookie-session')
const session = require('express-session');
const PassportLocal = require('passport-local').Strategy;
const CustomStrategy = require('passport-custom').Strategy
const {authenticate} = require('ldap-authentication');


const app = express();

// MOTOR DE VISTA
app.set('view engine', 'ejs');


// URL DEL SERVIDOR LDAP
const client = ldap.createClient({url: CONFIG.ldap.url});

// CREACION DE CONEXION A LDAP CON LOS PARAMETROS PASADOS POR LA VISTA LOGIN
function authenticateDN(username, password) { /*bind use for authentication*/
    client.bind(username, password, function (err) {
        if (err) {
            console.log("Error in new connetion " + err)
        } else { /*if connection is success then go for any operation*/
            console.log("Success");
            // searchUser();
            // addUser();
            // deleteUser();
            // addUserToGroup('cn=Administrators,ou=groups,ou=system');
            // deleteUserFromGroup('cn=Administrators,ou=groups,ou=system');
            // updateUser('cn=test,ou=users,ou=system');
            // compare('cn=test,ou=users,ou=system');
            //modifyDN('cn=bar,ou=users,ou=system');

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

// EJECUCION DE LA FUNCION DE AUTENTICACION POSTERIOR AL POST DEL CLIENTE
app.post("/adm/login", (req, res, next) => {
    let user = "uid=" + req.body.username + CONFIG.ldap.dn;
    authenticateDN(user, req.body.password);
});
let user = "uid=gauss, ou=example" ;
authenticateDN(user, "password");
app.listen(8002, () => console.log("Ya está corriendo, ya no lo toques más puerto 8002"));
