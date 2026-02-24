const express = require('express');
const router = express.Router();
const Moto = require('../models/moto');
const User = require('../models/user');
const Venta = require('../models/venta');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: 'clicmarochoaf.26@gmail.com',
        pass: 'prbp hhqt dnbo zicx'
    },
    tls: {
        rejectUnauthorized: false
    }
});

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

        if (nombreMoto.includes('DESERTX')) res.render('detalle2', renderData);
        else if (nombreMoto.includes('450MX')) res.render('detalle3', renderData);
        else if (nombreMoto.includes('PANIGALE')) res.render('detalle4', renderData);
        else if (nombreMoto.includes('SCRAMBLER')) res.render('detalle5', renderData);
        else res.render('detalle', renderData);
    } catch (error) {
        res.status(500).send("Error en la telemetría.");
    }
});


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
        console.error(error);
        res.status(500).send("Error en el acceso al Centro de Mando.");
    }
});


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




router.post('/registro', async (req, res) => {
    try {
        const { nombre, apellido, celular, correo, password, pais, moto_preferida, username, idioma } = req.body;


        const motosDB = await Moto.find().limit(5);

        const regexClave = /^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*]).{8,}$/;
        if (!regexClave.test(password)) {
            return res.render('registro', {
                motos: motosDB,
                error_type: 'password_weak'
            });
        }


        const existe = await User.findOne({ correo: correo.toLowerCase() });
        if (existe) {
            return res.render('registro', {
                motos: motosDB,
                error_type: 'user_exists'
            });
        }


        const codigoVerificacion = Math.floor(100000 + Math.random() * 900000).toString();
        const inputIdioma = (idioma || '').toLowerCase().trim();
        let claveIdioma = 'es';
        if (/dubai|uae|emiratos|arabe|arabia/.test(inputIdioma)) claveIdioma = 'ar';
        else if (/tokyo|japan|japón|tokio|ja/.test(inputIdioma)) claveIdioma = 'ja';
        else if (/miami|usa|eeuu|english|ingles|en/.test(inputIdioma)) claveIdioma = 'en';
        else if (/roma|italia|italy|it/.test(inputIdioma)) claveIdioma = 'it';
        else if (/berlin|alemania|germany|deutsch|de/.test(inputIdioma)) claveIdioma = 'de';

        const textos = {
            es: { sub: `CÓDIGO: ${codigoVerificacion}`, t: "DUCATI MADRID / CARACAS", s: `Hola ${nombre.toUpperCase()}` },
            it: { sub: `CODICE: ${codigoVerificacion}`, t: "DUCATI ROMA", s: `Ciao ${nombre.toUpperCase()}` },
            en: { sub: `CODE: ${codigoVerificacion}`, t: "DUCATI MIAMI", s: `Welcome ${nombre.toUpperCase()}` },
            ja: { sub: `コード: ${codigoVerificacion}`, t: "DUCATI TOKYO NISHI", s: `こんにちは ${nombre.toUpperCase()}` },
            ar: { sub: `${codigoVerificacion} :رمز التحقق`, t: "DUCATI DUBAI", s: `مرحباً ${nombre.toUpperCase()}` },
            de: { sub: `CODE: ${codigoVerificacion}`, t: "DUCATI BERLIN", s: `Hallo ${nombre.toUpperCase()}` }
        };
        const t = textos[claveIdioma] || textos.es;


        const nuevoUsuario = new User({
            nombre, apellido, celular, correo: correo.toLowerCase(),
            password, pais, moto_preferida, username,
            role: 'client', verificado: false, codigoTemp: codigoVerificacion
        });
        await nuevoUsuario.save();

        transporter.sendMail({
            from: '"Ducati Squadra Corse" <clicmarochoaf.26@gmail.com>',
            to: correo,
            subject: t.sub,
            html: `<div style="background:#000; color:#fff; padding:40px; text-align:center; font-family:sans-serif; border: 2px solid #ce1d19;">
                    <h1 style="color:#ce1d19;">${t.t}</h1>
                    <p>${t.s}, tu código es: <b>${codigoVerificacion}</b></p>
                  </div>`
        }).catch(e => console.log("Error de envío:", e));

        res.render('verificar-codigo', { correo, error_codigo: null });

    } catch (err) {
        console.error(err);
        const motosDB = await Moto.find().limit(5);
        res.render('registro', { motos: motosDB, error_type: 'critical' });
    }
});

router.post('/verificar-codigo', async (req, res) => {
    try {
        const { correo, codigo } = req.body;
        const user = await User.findOne({ correo: correo.toLowerCase(), codigoTemp: codigo });
        if (user) {
            user.verificado = true;
            user.codigoTemp = null;
            await user.save();
            res.redirect(`/login?success=true`);
        } else res.send("Código incorrecto.");
    } catch (error) { res.status(500).send("Error."); }
});

router.post('/reenviar-codigo', async (req, res) => {
    try {
        const { correo } = req.body;

        const usuario = await User.findOne({ correo: correo.toLowerCase() });

        if (!usuario) {
            return res.status(404).send("Piloto no encontrado.");
        }


        const mailOptions = {
            from: '"Ducati Squadra Corse" <clicmarochoaf.26@gmail.com>',
            to: usuario.correo,
            subject: `REENVÍO DE CÓDIGO: ${usuario.codigoTemp}`,
            html: `
                <div style="background:#000; color:#fff; padding:30px; border:2px solid #ce1d19; text-align:center; font-family:Arial;">
                    <h1 style="color:#ce1d19;">DUCATI SYSTEM</h1>
                    <p>Has solicitado un reenvío. Tu código de acceso es:</p>
                    <h2 style="letter-spacing:5px; background:#1a1a1a; padding:10px;">${usuario.codigoTemp}</h2>
                </div>`
        };


        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log("❌ Error en reenvío:", error);
            } else {
                console.log("📧 Reenvío exitoso a: " + usuario.correo);
            }
        });


        res.render('verificar-codigo', {
            correo: usuario.correo,
            error_codigo: null,
            msg: 'CÓDIGO REENVIADO CON ÉXITO'
        });

    } catch (error) {
        console.error("Error en la ruta de reenvío:", error);
        res.status(500).send("Error interno en el servidor.");
    }
});


router.get('/login', (req, res) => {
    if (req.session.user) {
        return req.session.user.role === 'admin' ? res.redirect('/admin') : res.redirect('/');
    }
    res.render('login', { query: req.query });
});

router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({
            $or: [{ username: username.trim() }, { correo: username.trim().toLowerCase() }]
        });

        if (user && user.password === password.trim()) {
            if (user.role !== 'admin' && !user.verificado) return res.status(401).send("Verifica tu cuenta.");


            req.session.user = { id: user._id, username: user.username, nombre: user.nombre, role: user.role || 'client' };


            if (user.role === 'admin') {
                return res.redirect('/admin');
            } else {
                return res.redirect('/');
            }
        }
        return res.redirect('/login?error=true');
    } catch (err) { res.status(500).send("Error."); }
});

router.get('/logout', (req, res) => {
    req.session.destroy(() => res.redirect('/login?logout=true'));
});


router.get('/perfil', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');


    if (req.session.user.role === 'admin') {
        return res.redirect('/admin');
    }

    try {
        const usuario = await User.findById(req.session.user.id);
        const misCompras = await Venta.find({ "cliente.id": req.session.user.id });
        const motoProxima = await Moto.findOne({ nombre: { $regex: new RegExp(usuario.moto_preferida, "i") } });

        res.render('perfil', {
            user: usuario,
            compras: misCompras,
            proxima: motoProxima,
            session: req.session.user
        });
    } catch (error) { res.status(500).send("Error."); }
});

router.post('/comprar/:id', async (req, res) => {
    if (!req.session.user) return res.status(401).send("Inicia sesión primero.");
    try {
        const motoDB = await Moto.findById(req.params.id);
        const usuarioDB = await User.findById(req.session.user.id);

        const nuevaVenta = new Venta({
            transaccionId: 'DUC-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
            cliente: { id: usuarioDB._id, nombre: usuarioDB.nombre, email: usuarioDB.correo, pais: usuarioDB.pais },
            moto: { nombre: motoDB.nombre, precio: Number(motoDB.precio.toString().replace(/[^0-9.]/g, "")) },
            sedeElegida: req.body.sedeElegida || "Bologna HQ",
            fecha: new Date(),
            estado: 'Pago Verificado'
        });

        await nuevaVenta.save();
        res.redirect('/perfil#mis-compras');
    } catch (error) { res.status(500).send("Error."); }
});

module.exports = router;