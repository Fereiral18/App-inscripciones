const express = require('express'); // 1. Primero requerir express
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const app = express(); // 2. Luego inicializar la app

// Middlewares
app.use(cors());
app.use(express.json());

// 3. Servir archivos estáticos (IMPORTANTE: Después de 'app')
// Esto permite que el navegador vea la carpeta frontend
app.use(express.static(path.join(__dirname, '../frontend')));

const PORT = process.env.PORT || 3000;

// --- 1. RUTAS DE USUARIO ---

app.post('/usuarios', async (req, res) => {
    const { nombre, apellido, cedula, contraseña } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO usuarios (nombre, apellido, cedula, contraseña, rol_id) 
             VALUES ($1, $2, $3, $4, 2) RETURNING id, cedula, nombre`,
            [nombre, apellido, cedula, contraseña]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: "Error al registrar: " + err.message });
    }
});

app.post('/login', async (req, res) => {
    const { cedula, contraseña } = req.body;
    try {
        const result = await pool.query(
            `SELECT u.*, r.nombre as rol_nombre 
             FROM usuarios u 
             JOIN roles r ON u.rol_id = r.id 
             WHERE u.cedula = $1 AND u.contraseña = $2`,
            [cedula, contraseña]
        );
        if (result.rows.length === 0) return res.status(401).json({ error: "Cédula o contraseña incorrecta" });
        res.json({ message: "Login exitoso", usuario: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 2. RUTAS DE DIRECCIÓN (Diagrama Pizarra) ---
app.post('/direcciones', async (req, res) => {
    const { calle, av, sector, n_casa, state, id_user } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO direcciones (calle, av, sector, n_casa, state, id_user) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [calle, av, sector, n_casa, state, id_user]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 3. RUTAS DE NEGOCIO ---
app.post('/inscripciones', async (req, res) => {
    const { usuario_id, estudiante_id } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO inscripciones (usuario_id, estudiante_id) VALUES ($1, $2) RETURNING *`,
            [usuario_id, estudiante_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/admin/inscripciones', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT i.id, u.nombre, u.apellido, e.nombre as estudiante, e.grado, d.sector
            FROM inscripciones i
            JOIN usuarios u ON i.usuario_id = u.id
            JOIN estudiantes e ON i.estudiante_id = e.id
            LEFT JOIN direcciones d ON u.id = d.id_user
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});