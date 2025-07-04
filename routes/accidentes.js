const express = require('express');
const router = express.Router();
const db = require('../db');
const { body, validationResult } = require('express-validator');

const checkValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
};

// Ver lista de accidentes
router.get('/accidentes', async (req, res) => {
    try {
        const [accidentes] = await db.query('SELECT * FROM accidente');
        for (let acc of accidentes) {
            const [personas] = await db.query(`
                SELECT p.* FROM persona p
                JOIN accidente_persona ap ON ap.persona_id = p.id
                WHERE ap.accidente_id = ?
            `, [acc.id]);
            const [vehiculos] = await db.query(`
                SELECT v.* FROM vehiculo v
                JOIN accidente_vehiculo av ON av.vehiculo_id = v.id
                WHERE av.accidente_id = ?
            `, [acc.id]);
            acc.personas = personas;
            acc.vehiculos = vehiculos;
        }
        res.render('accidentes/lista', { accidentes });
    } catch (err) {
        res.status(500).send('Error al cargar la lista de accidentes');
    }
});

// Formulario para nuevo accidente
router.get('/accidentes/nuevo', async (req, res) => {
    try {
        const [personas] = await db.query('SELECT * FROM persona');
        res.render('accidentes/nuevo', { personas });
    } catch (err) {
        res.status(500).send('Error al cargar el formulario');
    }
});

// Crear accidente
router.post(
    '/accidentes',
    [
        body('fecha').notEmpty(),
        body('hora').notEmpty(),
        body('lugar').notEmpty(),
        body('personas').exists(),
        body('vehiculos').exists()
    ],
    checkValidation,
    async (req, res) => {
        const { fecha, hora, lugar } = req.body;
        const personas = Array.isArray(req.body.personas) ? req.body.personas : [req.body.personas];
        const vehiculos = Array.isArray(req.body.vehiculos) ? req.body.vehiculos : [req.body.vehiculos];
        try {
            const [count] = await db.query('SELECT COUNT(*) as total FROM accidente');
            const referencia = `ACC-${String(count[0].total + 1).padStart(4, '0')}`;
            const [result] = await db.query(
                'INSERT INTO accidente (referencia, fecha, hora, lugar) VALUES (?, ?, ?, ?)',
                [referencia, fecha, hora, lugar]
            );
            const accId = result.insertId;
            for (const pid of personas) {
                await db.query(
                    'INSERT INTO accidente_persona (accidente_id, persona_id) VALUES (?, ?)',
                    [accId, pid]
                );
            }
            for (const vid of vehiculos) {
                await db.query(
                    'INSERT INTO accidente_vehiculo (accidente_id, vehiculo_id) VALUES (?, ?)',
                    [accId, vid]
                );
            }
            res.redirect('/accidentes');
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// Eliminar accidente
router.post('/accidentes/:id/eliminar', async (req, res) => {
    const id = req.params.id;
    try {
        await db.query('DELETE FROM accidente_persona WHERE accidente_id = ?', [id]);
        await db.query('DELETE FROM accidente_vehiculo WHERE accidente_id = ?', [id]);
        await db.query('DELETE FROM accidente WHERE id = ?', [id]);
        res.redirect('/accidentes');
    } catch (err) {
        res.status(500).send('Error al eliminar el accidente');
    }
});

//Obtener vehículos por múltiples personas
router.get('/api/personas/vehiculos', async (req, res) => {
    const ids = req.query.ids;
    if (!ids) return res.status(400).json({ error: 'Faltan IDs de personas' });
    const idsArray = ids.split(',').map(Number);
    try {
        const [vehiculos] = await db.query(`
            SELECT v.id, v.marca, v.modelo, v.matricula, p.id AS persona_id, CONCAT(p.nombre, ' ', p.apellidos) AS persona_nombre
            FROM vehiculo v
            JOIN persona_vehiculo pv ON pv.vehiculo_id = v.id
            JOIN persona p ON p.id = pv.persona_id
            WHERE pv.persona_id IN (?)
        `, [idsArray]);
        res.json(vehiculos);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener vehículos' });
    }
});

module.exports = router;
