const API_URL = 'http://localhost:3000';

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('usuario'));
    
    // Seguridad: Si no es admin, fuera
    if (!user || user.rol_id !== 1) {
        window.location.href = '../login/login.html';
        return;
    }

    // Saludo
    document.getElementById('user-greeting').textContent = `Hola, ${user.nombre} (Admin)`;

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('usuario');
        window.location.href = '../login/login.html';
    });

    // --- 1. CARGAR INSCRIPCIONES GLOBALES ---
    const container = document.getElementById('inscripciones-container');
    fetch(`${API_URL}/admin/inscripciones?usuario_id=${user.id}`)
        .then(res => res.json())
        .then(inscripciones => {
            if (inscripciones.length === 0) {
                container.innerHTML = '<p>No hay inscripciones registradas.</p>';
                return;
            }
            let html = '<table><thead><tr><th>ID</th><th>Usuario</th><th>Estudiante</th><th>Grado</th><th>Acciones</th></tr></thead><tbody>';
            inscripciones.forEach(i => {
                html += `<tr>
                    <td>${i.id}</td>
                    <td>${i.usuario_nombre} ${i.usuario_apellido}</td>
                    <td>${i.estudiante}</td>
                    <td>${i.grado}</td>
                    <td>
                        <button class="delete-inscr-btn" data-id="${i.id}">Borrar</button>
                    </td>
                </tr>`;
            });
            container.innerHTML = html + '</tbody></table>';

            // Event listener para borrar inscripciones
            document.querySelectorAll('.delete-inscr-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('¿Eliminar esta inscripción definitivamente?')) {
                        const id = e.target.dataset.id;
                        const res = await fetch(`${API_URL}/inscripciones/${id}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ usuario_id: user.id })
                        });
                        if (res.ok) location.reload();
                    }
                });
            });
        });

    // --- 2. CARGAR DIRECCIONES GLOBALES ---
    const dirContainer = document.getElementById('direcciones-container');
    fetch(`${API_URL}/admin/direcciones?usuario_id=${user.id}`)
        .then(res => res.json())
        .then(direcciones => {
            if (direcciones.length === 0) {
                dirContainer.innerHTML = '<p>No hay direcciones.</p>';
                return;
            }
            let html = '<table><thead><tr><th>Usuario</th><th>Calle</th><th>Sector</th><th>Acciones</th></tr></thead><tbody>';
            direcciones.forEach(d => {
                html += `<tr>
                    <td>${d.usuario_nombre} ${d.usuario_apellido}</td>
                    <td>${d.calle}</td>
                    <td>${d.sector}</td>
                    <td><button class="delete-dir-btn" data-id="${d.id}">Borrar</button></td>
                </tr>`;
            });
            dirContainer.innerHTML = html + '</tbody></table>';

            document.querySelectorAll('.delete-dir-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('¿Eliminar dirección?')) {
                        const id = e.target.dataset.id;
                        await fetch(`${API_URL}/direcciones/${id}`, {
                            method: 'DELETE',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ id_user: user.id })
                        });
                        location.reload();
                    }
                });
            });
        });

    // --- 3. FORMULARIOS (CREAR) ---

    // Crear Estudiante (Se asigna al Admin por defecto)
    document.getElementById('estudiante-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        data.usuario_id = user.id;

        const res = await fetch(`${API_URL}/estudiantes`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) {
            alert('Estudiante creado');
            location.reload();
        }
    });

    // Crear Inscripción (Select global)
    const estudianteSelect = document.getElementById('estudiante-select');
    fetch(`${API_URL}/estudiantes`)
        .then(res => res.json())
        .then(estudiantes => {
            estudiantes.forEach(est => {
                const opt = document.createElement('option');
                opt.value = est.id;
                opt.textContent = `${est.nombre} (${est.grado})`;
                estudianteSelect.appendChild(opt);
            });
        });

    document.getElementById('inscripcion-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const res = await fetch(`${API_URL}/inscripciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                estudiante_id: estudianteSelect.value, 
                usuario_id: user.id 
            })
        });
        if (res.ok) location.reload();
        else alert('Error: Estudiante ya inscrito o datos inválidos');
    });

    // Crear Dirección
    document.getElementById('direccion-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        data.id_user = user.id;

        const res = await fetch(`${API_URL}/direcciones`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (res.ok) location.reload();
    });
});