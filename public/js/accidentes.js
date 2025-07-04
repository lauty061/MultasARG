document.addEventListener('DOMContentLoaded', () => {
    const personaCheckboxes = document.querySelectorAll('input[name="personas[]"]');
    const vehiculoContainer = document.getElementById('vehiculos-checkboxes');

    const actualizarVehiculos = async () => {
        const selected = Array.from(personaCheckboxes)
            .filter(cb => cb.checked)
            .map(cb => cb.value);

        vehiculoContainer.innerHTML = '';

        if (!selected.length) {
            vehiculoContainer.innerHTML = '<p>Seleccione personas para mostrar vehículos relacionados</p>';
            return;
        }

        try {
            const response = await fetch(`/api/personas/vehiculos?ids=${selected.join(',')}`);
            const data = await response.json();

            if (!data.length) {
                vehiculoContainer.innerHTML = '<p>No hay vehículos relacionados</p>';
                return;
            }

            // Agrupar por persona
            const porPersona = {};
            data.forEach(({ id, marca, modelo, matricula, persona_id, persona_nombre }) => {
                if (!porPersona[persona_id]) porPersona[persona_id] = [];
                porPersona[persona_id].push({ id, marca, modelo, matricula });
            });

            for (const personaId in porPersona) {
                const personaVehiculos = porPersona[personaId];
                const divGrupo = document.createElement('div');
                const nombrePersona = data.find(v => v.persona_id == personaId)?.persona_nombre || 'Persona';

                const titulo = document.createElement('strong');
                titulo.textContent = `Vehículos de ${nombrePersona}`;
                divGrupo.appendChild(titulo);

                personaVehiculos.forEach(v => {
                    const label = document.createElement('label');
                    label.style.display = 'block';

                    const checkbox = document.createElement('input');
                    checkbox.type = 'checkbox';
                    checkbox.name = 'vehiculos[]';
                    checkbox.value = v.id;

                    label.appendChild(checkbox);
                    label.append(` ${v.marca} ${v.modelo} (${v.matricula})`);
                    divGrupo.appendChild(label);
                });

                vehiculoContainer.appendChild(divGrupo);
            }

        } catch (err) {
            console.error('Error al obtener vehículos:', err);
            vehiculoContainer.innerHTML = '<p>Error al cargar vehículos</p>';
        }
    };

    personaCheckboxes.forEach(cb => cb.addEventListener('change', actualizarVehiculos));
});
