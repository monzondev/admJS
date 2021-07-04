const express = require('express');
const passport = require('passport');
//LIBRERIA DE MANEJADORES DE PETICIONES HTTP
const app = express();

//LIBRERIA DE AUTENTICACION DE USUARIOS
const app = passport();

//MOTOR DE VISTA
app.set('view engine','ejs');


//VALIDACION DE LOGUEO
app.get("/adm",(req,res)=>{
//LOGUEADO
//NO LOGUEADO
});

    //FORMULARIO DE LOGUEO
app.get("/adm/login",(req,res)=>{
   res.render("login");
});

//RECIBIR CREDENCIALES E INICIAR SESION
app.post("/adm/login",(req,res)=>{
    res.send("Hola mundo");
});

app.listen(8000,()=>console.log("Server started"));