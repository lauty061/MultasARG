const express = require("express");
const router = express.Router();
const db = require("../db");
const { body, param, validationResult } = require("express-validator");

const checkValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
        return res.status(400).json({ errors: errors.array() });
    next();
};

// Mostrar lista de personas
router.get("/personas", async (req, res) => {
    try {
        const [personas] = await db.query("SELECT * FROM persona");
        for (let persona of personas) {
            const [vehiculos] = await db.query(
                `
                SELECT v.* FROM vehiculo v
                JOIN persona_vehiculo pv ON pv.vehiculo_id = v.id
                WHERE pv.persona_id = ?
            `,
                [persona.id]
            );
            persona.vehiculos = vehiculos;
        }
        res.render("personas/lista", { personas });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error al cargar la lista de personas");
    }
});

// Formulario para crear persona
router.get("/personas/nueva", (req, res) => {
    res.render("personas/nueva");
});

// Crear persona
router.post(
    "/personas",
    [
        body("nombre").notEmpty(),
        body("apellidos").notEmpty(),
        body("direccion").notEmpty(),
        body("poblacion").notEmpty(),
        body("telefono").isLength({ min: 6 }),
        body("dni").notEmpty(),
    ],
    checkValidation,
    async (req, res) => {
        const { nombre, apellidos, direccion, poblacion, telefono, dni } = req.body;
        try {
            await db.query(
                "INSERT INTO persona (nombre, apellidos, direccion, poblacion, telefono, dni) VALUES (?, ?, ?, ?, ?, ?)",
                [nombre, apellidos, direccion, poblacion, telefono, dni]
            );
            res.redirect("/personas");
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

module.exports = router;
