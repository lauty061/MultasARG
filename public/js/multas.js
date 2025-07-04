document.addEventListener('DOMContentLoaded', () => {
    const personaSelect = document.getElementById('persona_id');
    const vehiculoSelect = document.getElementById('vehiculo_id');

    if (!personaSelect || !vehiculoSelect) return;

    const cargarVehiculos = async (personaId) => {
        vehiculoSelect.innerHTML = '';

        try {
            const response = await fetch(`/api/personas/${personaId}/vehiculos`);
            const vehiculos = await response.json();

            if (vehiculos.length === 0) {
                const opt = document.createElement('option');
                opt.text = 'Esta persona no tiene vehículos';
                opt.disabled = true;
                opt.selected = true;
                vehiculoSelect.appendChild(opt);
                return;
            }

            vehiculos.forEach(v => {
                const opt = document.createElement('option');
                opt.value = v.id;
                opt.text = `${v.marca} ${v.modelo} (${v.matricula})`;
                vehiculoSelect.appendChild(opt);
            });
        } catch (err) {
            console.error('Error al obtener vehículos:', err);
        }
    };

    cargarVehiculos(personaSelect.value); // inicial

    personaSelect.addEventListener('change', () => {
        cargarVehiculos(personaSelect.value);
    });
});
