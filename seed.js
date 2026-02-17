const mongoose = require('mongoose');


const MONGO_URI = "mongodb+srv://clicmarochoaf26_db_user:Uen7tpHe7NQleH8D@cluster0.gr6q6rr.mongodb.net/concesionario?retryWrites=true&w=majority&appName=Cluster0";


const MotoSchema = new mongoose.Schema({
    nombre: String,
    motor: String,
    potencia: String,
    precio: String,
    img: String
});


const Moto = mongoose.models.Moto || mongoose.model('Moto', MotoSchema);


const motos = [
    {
        nombre: "Panigale V4 R",
        motor: "998 cc",
        potencia: "218 hp",
        precio: "44.000 €",
        img: "/img/paginale-v4.png"
    },
    {
        nombre: "Multistrada V4",
        motor: "1.158 cc",
        potencia: "170 hp",
        precio: "22.790 €",
        img: "/img/Multistrada-V4.png"
    },
    {
        nombre: "Monster",
        motor: "890 cc",
        potencia: "111 hp",
        precio: "13.190 €",
        img: "/img/monster.png"
    },
    {
        nombre: "DesertX",
        motor: "937 cc",
        potencia: "110 hp",
        precio: "17.690 €",
        img: "/img/DesertX.png"
    },
    {
        nombre: "Diavel V4",
        motor: "1.158 cc",
        potencia: "168 hp",
        precio: "31.090 €",
        img: "/img/Diavel-V4.png"
    },
    {
        nombre: "Streetfighter V4",
        motor: "1.103 cc",
        potencia: "208 hp",
        precio: "24.390 €",
        img: "/img/Streetfighter-V4.png"
    },
    {
        nombre: "Hypermotard 950",
        motor: "937 cc",
        potencia: "114 hp",
        precio: "16.990 €",
        img: "/img/Hypermotard-V2.png"
    },
    {
        nombre: "Scrambler Icon Dark",
        motor: "803 cc",
        potencia: "73 hp",
        precio: "11.190 €",
        img: "/img/Scrambler-Icon-Dark.png"
    },
    {
        nombre: "Desmo 450MX",
        motor: "449.6 cc",
        potencia: "63.5 hp",
        precio: "16.290 €",
        img: "/img/Desmo-450MX.png"
    },
    {
        nombre: "XDiavel V4",
        motor: "1.158 cc",
        potencia: "168 hp",
        precio: "32.990 €",
        img: "/img/XDiavel-V4.png"
    }
];


async function seedDB() {
    try {
        
        await mongoose.connect(MONGO_URI);
        console.log("✅ Ducati Backend Conectado");
        
        
        await Moto.deleteMany({}); 
        console.log("🗑️ Datos antiguos borrados de Atlas.");

        
        await Moto.insertMany(motos);
        console.log("🏍️ ¡Modelos oficiales cargados con éxito!");

        await mongoose.connection.close();
        console.log("🔌 Conexión cerrada.");
    } catch (error) {
        console.error("❌ Error en el seeding:", error);
        process.exit(1);
    }
}

seedDB();