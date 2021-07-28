//Iniciamos express
const express = require('express');
const app = express();

//Urlencoded para el formulario
app.use(express.urlencoded({extended:false}));
app.use(express.json());

//Public
app.use('/resources', express.static('/public'));
app.use('/resources', express.static(__dirname+ '/public'));


//Plantillas ejs
app.set('view engine', 'ejs');

//Bcryptjs
const bcryptjs = require('bcryptjs');

//Variables de sesion
const session = require('express-session');

app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
}));

//Llamamos la conexion a la BD
const connection = require('./database/db');


//RUTAS
app.get('/login', (req, res) => {
    res.render('login');
})
app.get('/register', (req, res) => {
    res.render('register');
})

//Registro
app.post('/register', async (req, res) => {
    const user = req.body.user;
    const name = req.body.name;
    const rol = req.body.rol;
    const pass = req.body.pass;
    let passwordHaash = await bcryptjs.hash(pass, 8);
    connection.query('INSERT INTO users SET ?', {user:user, name:name, rol:rol, pass:passwordHaash}, async(error, results) =>{
        if (error) {
            console.log(error);
        } else {
            res.render('register', {
                alert: true,
                alertTitle: "Usuario creado",
                alertMessage: "Registrado exitosamente",
                alertIcon: 'success',
                showConfirmButton: false,
                timer: 2000,
                ruta: '',
            })   
        }
    })
})

//Autenticacion
app.post('/auth', async (req, res) => {
    const user = req.body.user;
    const pass = req.body.pass;
    let passwordHaash = await bcryptjs.hash(pass, 8);
    if(user && pass) {
        connection.query('SELECT * FROM users WHERE user = ?', [user], async (error, results) => {
            if( results.length == 0 || !(await bcryptjs.compare(pass, results[0].pass)) ){
                res.render('login', {
                    alert: true,
                    alertTitle: "Error",
                    alertMessage: "Usuario y/o contraseña incorrectos",
                    alertIcon: "error",
                    showConfirmButton: true,
                    timer: '',
                    ruta: 'login',
                });
            }else{
                req.session.loggedin = true;
                req.session.name = results[0].name
                res.render('login',{
                    alert: true,
                    alertTitle: "Conexion exitosa",
                    alertMessage: "Iniciando sesión",
                    alertIcon: "success",
                    showConfirmButton: false,
                    timer: 2500,
                    ruta: '',
                });
            }

        })
    }else{
        res.render('login',{
            alert: true,
            alertTitle: "Ingrese usuario y/o contraseña para iniciar sesión",
            alertMessage: "Error",
            alertIcon: "warning",
            showConfirmButton: true,
            timer: '',
            ruta: 'login',
        });
    }
})

//Autenticacion para todas las paginas
app.get('/', (req, res) => {
    if (req.session.loggedin) {
        res.render('index',{
            login: true,
            name: req.session.name,

        });
    } else {
        res.render('index', {
            login: false,
            name: 'Debe iniciar sesión',
        })
    }
})

//Desconectarse
app.get('/logout', (req, res) => {
    req.session.destroy( () => {
        res.redirect('/')
    })
})

//Iniciamos el servidor
app.listen(3000, () => {
    console.log('Server corriendo en http://localhost:3000');
});