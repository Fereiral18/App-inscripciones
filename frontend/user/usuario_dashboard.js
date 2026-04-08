const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('usuario'));
    if (!user) {
        window.location.href = '../login/login.html';
        return;
    }

    // Saludo y Logout
    document.getElementById('user-greeting').textContent = `Hola, ${user.nombre}`;
    document.getElementById('logout-btn').onclick = () => {
        localStorage.removeItem('usuario');
        window.location.href = '../login/login.html';
    };

    // --- CARGAR DATOS ---
    cargarEstudiantes();
    cargarInscripciones();
    cargarDirecciones();

    // --- FORMULARIOS ---

    // 1. Crear Estudiante
    document.getElementById('estudiante-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        data.usuario_id = user.id; // Vinculamos al usuario actual

        const res = await fetch(`${API_URL}/estudiantes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) location.reload();
    };

    // 2. Crear Dirección
    document.getElementById('direccion-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        data.id_user = user.id; // Según tu tabla SQL

        const res = await fetch(`${API_URL}/direcciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) location.reload();
    };

    // 3. Crear Inscripción
    document.getElementById('inscripcion-form').onsubmit = async (e) => {
        e.preventDefault();
        const estudiante_id = document.getElementById('estudiante-select').value;
        
        const res = await fetch(`${API_URL}/inscripciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estudiante_id, usuario_id: user.id })
        });
        if (res.ok) location.reload();
    };

    // --- FUNCIONES DE CARGA ---

    function cargarEstudiantes() {
        const select = document.getElementById('estudiante-select');
        fetch(`${API_URL}/estudiantes/usuario?usuario_id=${user.id}`)
            .then(res => res.json())
            .then(data => {
                data.forEach(est => {
                    const opt = document.createElement('option');
                    opt.value = est.id;
                    opt.textContent = est.nombre;
                    select.appendChild(opt);
                });
            });
    }

    function cargarInscripciones() {
        const container = document.getElementById('inscripciones-container');
        fetch(`${API_URL}/inscripciones/usuario?usuario_id=${user.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.length === 0) { container.innerHTML = '<p>Sin inscripciones.</p>'; return; }
                let html = '<table><thead><tr><th>Estudiante</th><th>Grado</th><th>Acciones</th></tr></thead><tbody>';
                data.forEach(i => {
                    html += `<tr><td>${i.estudiante_nombre}</td><td>${i.grado}</td>
                    <td><button onclick="borrarInscripcion(${i.id})">Borrar</button></td></tr>`;
                });
                container.innerHTML = html + '</tbody></table>';
            });
    }

    function cargarDirecciones() {
        const container = document.getElementById('direcciones-container');
        fetch(`${API_URL}/direcciones/usuario?usuario_id=${user.id}`)
            .then(res => res.json())
            .then(data => {
                if (data.length === 0) { container.innerHTML = '<p>Sin direcciones.</p>'; return; }
                let html = '<table><thead><tr><th>Calle</th><th>Sector</th><th>Estado</th></tr></thead><tbody>';
                data.forEach(d => {
                    html += `<tr><td>${d.calle}</td><td>${d.sector}</td><td>${d.state}</td></tr>`;
                });
                container.innerHTML = html + '</tbody></table>';
            });
    }
});

// Funciones globales para botones dinámicos
async function borrarInscripcion(id) {
    const user = JSON.parse(localStorage.getItem('usuario')); // Necesitamos el ID del usuario
    if (confirm('¿Eliminar esta inscripción?')) {
        await fetch(`${API_URL}/inscripciones/${id}`, { 
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario_id: user.id }) // <--- Esto faltaba
        });
        location.reload();
    }
}