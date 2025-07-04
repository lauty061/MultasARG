const express = require('express');
const router = express.Router();
const db = require('../db');

// Mostrar lista de vehículos
router.get('/vehiculos', async (req, res) => {
    try {
        const [vehiculos] = await db.query('SELECT * FROM vehiculo');
        for (let vehiculo of vehiculos) {
            const [propietarios] = await db.query(`
                SELECT p.* FROM persona p
                JOIN persona_vehiculo pv ON pv.persona_id = p.id
                WHERE pv.vehiculo_id = ?
            `, [vehiculo.id]);
            vehiculo.propietarios = propietarios;
        }
        res.render('vehiculos/lista', { vehiculos });
    } catch (err) {
        console.error(err);
        res.status(500).send('Error al cargar la lista de vehículos');
    }
});

// Formulario para crear vehículo
router.get('/vehiculos/nuevo', async (req, res) => {
    try {
        const [personas] = await db.query('SELECT * FROM persona');
        res.render('vehiculos/nuevo', { personas });
    } catch (err) {
        res.status(500).send('Error al cargar el formulario de vehículo');
    }
});

// Crear vehículo
router.post('/vehiculos', async (req, res) => {
    const { marca, modelo, matricula, propietarios } = req.body;

    try {
        const [result] = await db.query(
            'INSERT INTO vehiculo (marca, modelo, matricula) VALUES (?, ?, ?)',
            [marca, modelo, matricula]
        );
        const vehiculoId = result.insertId;
        const propietariosArray = Array.isArray(propietarios) ? propietarios : [propietarios];
        for (const personaId of propietariosArray) {
            await db.query(
                'INSERT INTO persona_vehiculo (persona_id, vehiculo_id) VALUES (?, ?)',
                [personaId, vehiculoId]
            );
        }
        res.redirect('/vehiculos');
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
