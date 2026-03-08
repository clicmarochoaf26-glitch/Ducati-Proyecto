const express = require('express');
const router = express.Router();
const Moto = require('../models/moto');
const User = require('../models/user');
const Venta = require('../models/venta');

// --- 1. RUTAS PÚBLICAS (HOME Y DETALLES) ---

router.get('/', async (req, res) => {
    try {
        const motosDB = await Moto.find().limit(5);
        res.render('index', {
            motos: motosDB,
            session: req.session.user || null
        });
    } catch (error) {
        res.status(500).send("Error en el servidor de Ducati");
    }
});

router.get('/moto/:id', async (req, res) => {
    try {
        const moto = await Moto.findById(req.params.id);
        if (!moto) return res.status(404).send("Esta Ducati no existe.");

        const nombreMoto = moto.nombre.toUpperCase().trim();
        const renderData = { moto, session: req.session.user || null };

        // Lógica de renders específicos por modelo
        if (nombreMoto.includes('DESERTX')) res.render('detalle2', renderData);
        else if (nombreMoto.includes('450MX')) res.render('detalle3', renderData);
        else if (nombreMoto.includes('PANIGALE')) res.render('detalle4', renderData);
        else if (nombreMoto.includes('SCRAMBLER')) res.render('detalle5', renderData);
        else res.render('detalle', renderData);
    } catch (error) {
        res.status(500).send("Error en la telemetría.");
    }
});

// --- 2. SISTEMA DE REGISTRO DIRECTO (SIN CORREOS) ---

router.get('/registro', async (req, res) => {
    if (req.session.user) return res.redirect('/');
    try {
        const motosDB = await Moto.find().limit(5);
        // Enviamos error_type como null por defecto para evitar errores en EJS
        res.render('registro', { motos: motosDB, error_type: null });
    } catch (error) {
        res.status(500).send("Error al cargar el hangar.");
    }
});

router.post('/registro', async (req, res) => {
    try {
        const { nombre, apellido, celular, correo, password, pais, moto_preferida, username } = req.body;
        const motosDB = await Moto.find().limit(5);

        // Validación de contraseña segura
        const regexClave = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
        if (!regexClave.test(password)) {
            return res.render('registro', { motos: motosDB, error_type: 'password_weak' });
        }

        // Verificar si el correo ya está en uso
        const existe = await User.findOne({ correo: correo.toLowerCase() });
        if (existe) {
            return res.render('registro', { motos: motosDB, error_type: 'user_exists' });
        }

        // Crear usuario con verificado: true (Acceso instantáneo)
        const nuevoUsuario = new User({
            nombre,
            apellido,
            celular,
            correo: correo.toLowerCase(),
            password, // Recomendado: usar bcrypt.hash() antes de guardar
            pais,
            moto_preferida,
            username,
            role: 'client',
            verificado: true
        });

        await nuevoUsuario.save();
        console.log(`✅ NUEVO PILOTO REGISTRADO: ${username}`);

        // Redirigir al login con parámetro de éxito para mostrar alerta
        res.redirect('/login?success_reg=true');

    } catch (err) {
        console.error("❌ ERROR CRÍTICO EN REGISTRO:", err);
        const motosDB = await Moto.find().limit(5);
        res.render('registro', { motos: motosDB, error_type: 'critical' });
    }
});

// --- 3. SISTEMA DE ACCESO (LOGIN) ---

router.get('/login', (req, res) => {
    if (req.session.user) {
        return req.session.user.role === 'admin' ? res.redirect('/admin') : res.redirect('/');
    }
    res.render('login', { query: req.query });
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Buscar por username o por correo
        const user = await User.findOne({
            $or: [
                { username: username.trim() },
                { correo: username.trim().toLowerCase() }
            ]
        });

        if (user && user.password === password.trim()) {
            // Guardar sesión del piloto
            req.session.user = {
                id: user._id,
                username: user.username,
                nombre: user.nombre,
                role: user.role || 'client'
            };

            return user.role === 'admin' ? res.redirect('/admin') : res.redirect('/');
        }

        // Si falla, volver al login con error
        return res.redirect('/login?error=true');
    } catch (err) {
        console.error("❌ ERROR LOGIN:", err);
        res.status(500).send("Error en el sistema de acceso.");
    }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login?logout=true'));
});

// --- 4. PANEL DE ADMINISTRACIÓN (SEGURIZADO) ---

router.get('/admin', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') {
        return res.status(403).send("ACCESO DENEGADO. SOLO PERSONAL DE BORGO PANIGALE.");
    }
    try {
        const usuariosDB = await User.find();
        const ventasDB = await Venta.find();
        const motosDB = await Moto.find().limit(5);

        res.render('admin', {
            usuarios: usuariosDB,
            ventas: ventasDB,
            motos: motosDB,
            user: req.session.user
        });
    } catch (error) {
        res.status(500).send("Error en el Centro de Mando.");
    }
});

// APIs de administración para llamadas AJAX (Fetch)
router.post('/admin/ventas/estado/:id', async (req, res) => {
    try {
        await Venta.findByIdAndUpdate(req.params.id, { estado: req.body.nuevoEstado });
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err); }
});

router.post('/admin/motos/update-price/:id', async (req, res) => {
    try {
        await Moto.findByIdAndUpdate(req.params.id, { precio: req.body.nuevoPrecio });
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err); }
});

router.post('/admin/motos/delete/:id', async (req, res) => {
    try {
        await Moto.findByIdAndDelete(req.params.id);
        res.sendStatus(200);
    } catch (err) { res.status(500).send(err); }
});

// --- 5. PERFIL DE USUARIO Y COMPRAS ---

router.get('/perfil', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    if (req.session.user.role === 'admin') return res.redirect('/admin');

    try {
        const usuario = await User.findById(req.session.user.id);
        const misCompras = await Venta.find({ "cliente.id": req.session.user.id });

        // Buscar info de su moto favorita
        const motoProxima = await Moto.findOne({
            nombre: { $regex: new RegExp(usuario.moto_preferida, "i") }
        });

        res.render('perfil', {
            user: usuario,
            compras: misCompras,
            proxima: motoProxima,
            session: req.session.user
        });
    } catch (error) {
        res.status(500).send("Error al cargar perfil.");
    }
});

router.post('/comprar/:id', async (req, res) => {
    if (!req.session.user) return res.status(401).send("Inicia sesión primero.");
    try {
        const motoDB = await Moto.findById(req.params.id);
        const usuarioDB = await User.findById(req.session.user.id);

        const nuevaVenta = new Venta({
            transaccionId: 'DUC-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            cliente: {
                id: usuarioDB._id,
                nombre: usuarioDB.nombre,
                email: usuarioDB.correo,
                pais: usuarioDB.pais
            },
            moto: {
                nombre: motoDB.nombre,
                precio: Number(motoDB.precio.toString().replace(/[^0-9.]/g, ""))
            },
            sedeElegida: req.body.sedeElegida || "Bologna HQ",
            fecha: new Date(),
            estado: 'Pago Verificado'
        });

        await nuevaVenta.save();
        res.redirect('/perfil#mis-compras');
    } catch (error) {
        console.error(error);
        res.status(500).send("Error en la transacción.");
    }
});

module.exports = router;