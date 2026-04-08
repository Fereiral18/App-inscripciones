const express = require('express');
require('dotenv').config();
const pool = require('./db');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// -------------------- RUTAS --------------------

// Registrar usuario
app.post('/usuarios', async (req, res) => {
    const { nombre, email, contraseña, rol } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO usuarios (nombre, email, contraseña, rol)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [nombre, email, contraseña, rol || 'user']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creando usuario' });
    }
});

// Login sencillo (sin JWT)
app.post('/login', async (req, res) => {
    const { email, contraseña } = req.body;
    try {
        const result = await pool.query(
            `SELECT * FROM usuarios WHERE email = $1 AND contraseña = $2`,
            [email, contraseña]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales incorrectas' });
        }

        res.json({ message: 'Login exitoso', usuario: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en login' });
    }
});

// Crear estudiante
app.post('/estudiantes', async (req, res) => {
    const { nombre, grado } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO estudiantes (nombre, grado) VALUES ($1, $2) RETURNING *`,
            [nombre, grado]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creando estudiante' });
    }
});

// Crear inscripción (usuario inscribe estudiante)
app.post('/inscripciones', async (req, res) => {
    const { usuario_id, estudiante_id } = req.body;
    try {
        const result = await pool.query(
            `INSERT INTO inscripciones (usuario_id, estudiante_id) VALUES ($1, $2) RETURNING *`,
            [usuario_id, estudiante_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error creando inscripción' });
    }
});

// Obtener todas las inscripciones (solo admin)
app.get('/inscripciones', async (req, res) => {
    const role = req.headers['role']; // simple control de acceso
    if (role !== 'admin') {
        return res.status(403).json({ message: 'Acceso denegado' });
    }

    try {
        const result = await pool.query(`
            SELECT i.id, u.nombre as usuario, e.nombre as estudiante, i.fecha_inscripcion
            FROM inscripciones i
            JOIN usuarios u ON i.usuario_id = u.id
            JOIN estudiantes e ON i.estudiante_id = e.id
        `);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// -------------------- SERVIDOR --------------------
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});