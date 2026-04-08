const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

const PORT = process.env.PORT || 3000;

// --- FUNCIONALIDAD COMPARTIDA / UTILS ---

// Middleware para proteger rutas de Admin
const verificarAdmin = async (req, res, next) => {
    try {
        // Obtenemos el ID de cualquier fuente posible (Query o Body)
        // Agregamos "?" para que no explote si req.body o req.query no existen
        const usuario_id = req.query?.usuario_id || req.body?.usuario_id;
        
        if (!usuario_id) {
            return res.status(403).json({ error: "Falta ID de usuario para verificar permisos" });
        }

        const result = await pool.query('SELECT rol_id FROM usuarios WHERE id = $1', [usuario_id]);
        
        // Verificamos si existe el usuario y si su rol es 1 (Admin)
        if (result.rows.length > 0 && result.rows[0].rol_id === 1) {
            next();
        } else {
            res.status(403).json({ error: "Acceso denegado: No tienes permisos de administrador" });
        }
    } catch (err) {
        console.error("Error en verificarAdmin:", err);
        res.status(500).json({ error: "Error interno al verificar permisos" });
    }
};

// --- RUTAS DE ADMIN (Control Total) ---

app.get('/admin/inscripciones', verificarAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                i.id, 
                u.nombre AS usuario_nombre, 
                u.apellido AS usuario_apellido, 
                e.nombre AS estudiante, -- Debe ser 'estudiante' para tu JS actual
                e.grado
            FROM inscripciones i
            JOIN usuarios u ON i.usuario_id = u.id
            JOIN estudiantes e ON i.estudiante_id = e.id
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Ruta global de direcciones para Admin
app.get('/admin/direcciones', verificarAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                d.*, 
                u.nombre AS usuario_nombre, 
                u.apellido AS usuario_apellido 
            FROM direcciones d 
            JOIN usuarios u ON d.id_user = u.id
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Editar estudiante (Solo Admin)
app.put('/estudiantes/:id', verificarAdmin, async (req, res) => {
    const { id } = req.params;
    const { nombre, grado } = req.body;
    try {
        await pool.query(
            'UPDATE estudiantes SET nombre = $1, grado = $2 WHERE id = $3',
            [nombre, grado, id]
        );
        res.json({ message: "Estudiante actualizado" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/estudiantes', async (req, res) => {
    const result = await pool.query('SELECT * FROM estudiantes'); // Sin WHERE
    res.json(result.rows);
});

// --- 1. RUTAS DE USUARIO & LOGIN ---

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

// --- 2. RUTAS PARA ESTUDIANTES ---

app.get('/estudiantes/usuario', async (req, res) => {
    const { usuario_id } = req.query;
    try {
        const result = await pool.query('SELECT * FROM estudiantes WHERE usuario_id = $1', [usuario_id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/estudiantes', async (req, res) => {
    const { nombre, grado, usuario_id } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO estudiantes (nombre, grado, usuario_id) VALUES ($1, $2, $3) RETURNING *',
            [nombre, grado, usuario_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 3. RUTAS PARA DIRECCIONES ---

app.get('/direcciones/usuario', async (req, res) => {
    const { usuario_id } = req.query;
    try {
        const result = await pool.query('SELECT * FROM direcciones WHERE id_user = $1', [usuario_id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

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

app.delete('/direcciones/:id', async (req, res) => {
    const { id } = req.params;
    const { id_user } = req.body;
    try {
        const user = await pool.query('SELECT rol_id FROM usuarios WHERE id = $1', [id_user]);
        if (user.rows.length > 0 && user.rows[0].rol_id === 1) {
            await pool.query('DELETE FROM direcciones WHERE id = $1', [id]);
        } else {
            await pool.query('DELETE FROM direcciones WHERE id = $1 AND id_user = $2', [id, id_user]);
        }
        res.json({ message: 'Dirección eliminada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- 4. RUTAS PARA INSCRIPCIONES ---

app.post('/inscripciones', async (req, res) => {
    const { estudiante_id, usuario_id } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO inscripciones (estudiante_id, usuario_id) VALUES ($1, $2) RETURNING *',
            [estudiante_id, usuario_id]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: "El estudiante ya posee una inscripción activa." });
        }
        res.status(500).json({ error: err.message });
    }
});

app.get('/inscripciones/usuario', async (req, res) => {
    const { usuario_id } = req.query;
    try {
        const result = await pool.query(`
            SELECT i.id, e.nombre as estudiante_nombre, e.grado
            FROM inscripciones i
            JOIN estudiantes e ON i.estudiante_id = e.id
            WHERE i.usuario_id = $1
        `, [usuario_id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/inscripciones/:id', async (req, res) => {
    const { id } = req.params;
    const { usuario_id } = req.body;
    try {
        const user = await pool.query('SELECT rol_id FROM usuarios WHERE id = $1', [usuario_id]);
        if (user.rows.length > 0 && user.rows[0].rol_id === 1) {
            await pool.query('DELETE FROM inscripciones WHERE id = $1', [id]);
        } else {
            await pool.query('DELETE FROM inscripciones WHERE id = $1 AND usuario_id = $2', [id, usuario_id]);
        }
        res.json({ message: 'Inscripción eliminada' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor en puerto ${PORT}`);
});