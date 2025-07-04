const express = require('express');
const router = express.Router();
const db = require('../db');
const { body, validationResult } = require('express-validator');

// Middleware de validación
const checkValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
};

// Mostrar lista de multas
router.get('/multas', async (req, res) => {
    try {
        const [multas] = await db.query(`
            SELECT m.*, p.nombre, p.apellidos, v.matricula
            FROM multa m
            JOIN persona p ON m.persona_id = p.id
            JOIN vehiculo v ON m.vehiculo_id = v.id
        `);
        res.render('multas/lista', { multas });
    } catch (err) {
        res.status(500).send('Error al cargar las multas');
    }
});

// Formulario nueva multa
router.get('/multas/nueva', async (req, res) => {
    try {
        const [personas] = await db.query('SELECT * FROM persona');
        const [vehiculos] = await db.query('SELECT * FROM vehiculo');
        res.render('multas/nueva', { personas, vehiculos });
    } catch (err) {
        res.status(500).send('Error al cargar formulario de multa');
    }
});

// Crear multa
router.post(
    '/multas',
    [
        body('fecha').notEmpty(),
        body('hora').notEmpty(),
        body('lugar').notEmpty(),
        body('importe').isDecimal(),
        body('persona_id').isInt(),
        body('vehiculo_id').isInt()
    ],
    checkValidation,
    async (req, res) => {
        const { fecha, hora, lugar, importe, persona_id, vehiculo_id } = req.body;

        try {
            const [count] = await db.query('SELECT COUNT(*) as total FROM multa');
            const referencia = `MULTA-${String(count[0].total + 1).padStart(4, '0')}`;
            await db.query(`
                INSERT INTO multa (referencia, fecha, hora, lugar, importe, persona_id, vehiculo_id)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `, [referencia, fecha, hora, lugar, importe, persona_id, vehiculo_id]);
            res.redirect('/multas');
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// Eliminar multa
router.post('/multas/:id/eliminar', async (req, res) => {
    try {
        await db.query('DELETE FROM multa WHERE id = ?', [req.params.id]);
        res.redirect('/multas');
    } catch (err) {
        res.status(500).send('Error al eliminar la multa');
    }
});

//Obtener vehículos por persona
router.get('/api/personas/:id/vehiculos', async (req, res) => {
    try {
        const [vehiculos] = await db.query(`
            SELECT v.id, v.marca, v.modelo, v.matricula
            FROM vehiculo v
            JOIN persona_vehiculo pv ON pv.vehiculo_id = v.id
            WHERE pv.persona_id = ?
        `, [req.params.id]);
        res.json(vehiculos);
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener los vehículos' });
    }
});

module.exports = router;
