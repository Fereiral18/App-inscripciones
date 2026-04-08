-- 1. ROLES
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL
);
INSERT INTO roles (nombre) VALUES ('admin'), ('user');

-- 2. USUARIOS
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    cedula VARCHAR(20) UNIQUE NOT NULL,
    contraseña VARCHAR(255) NOT NULL,
    rol_id INTEGER REFERENCES roles(id) DEFAULT 2
);
INSERT INTO usuarios (nombre, apellido, cedula, contraseña, rol_id) VALUES 
('Admin', 'Escuela', '1010', '123', 1),
('Facundo', 'Fereira', '2020', '123', 2);

-- 3. DIRECCIONES
CREATE TABLE direcciones (
    id SERIAL PRIMARY KEY,
    calle VARCHAR(255),
    av VARCHAR(255),
    sector VARCHAR(100),
    n_casa VARCHAR(50),
    state VARCHAR(100),
    id_user INTEGER REFERENCES usuarios(id) ON DELETE CASCADE
);
INSERT INTO direcciones (calle, av, sector, n_casa, state, id_user) VALUES 
('Av. San Martin', '9 de Julio', 'Centro', '150', 'Mendoza', 2);

-- 4. MODULOS Y PERMISOS (RBAC)
CREATE TABLE modulos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL
);
INSERT INTO modulos (nombre) VALUES ('Inscripciones'), ('Ajustes');

CREATE TABLE rm_pagin (
    id SERIAL PRIMARY KEY,
    rol_id INTEGER REFERENCES roles(id),
    modulo_id INTEGER REFERENCES modulos(id),
    pagina VARCHAR(100)
);
INSERT INTO rm_pagin (rol_id, modulo_id, pagina) VALUES (1, 1, '/admin/reportes');

CREATE TABLE permisos (
    id SERIAL PRIMARY KEY,
    id_rm_pagin INTEGER REFERENCES rm_pagin(id),
    puede_crear BOOLEAN DEFAULT FALSE,
    puede_leer BOOLEAN DEFAULT TRUE,
    puede_editar BOOLEAN DEFAULT FALSE,
    puede_borrar BOOLEAN DEFAULT FALSE
);
INSERT INTO permisos (id_rm_pagin, puede_crear, puede_leer, puede_editar, puede_borrar) 
VALUES (1, true, true, true, true);

-- 5. LÓGICA DE NEGOCIO (CORREGIDA)
CREATE TABLE estudiantes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    grado VARCHAR(50) NOT NULL,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE
);
-- Insert de ejemplo corregido con usuario_id
INSERT INTO estudiantes (nombre, grado, usuario_id) VALUES ('Juanito Pérez', '5to Grado', 2);

CREATE TABLE inscripciones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    estudiante_id INTEGER REFERENCES estudiantes(id) ON DELETE CASCADE,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- RESTRICCIÓN CLAVE: Evita inscribir al mismo alumno dos veces
    CONSTRAINT estudiante_unico UNIQUE (estudiante_id)
);
INSERT INTO inscripciones (usuario_id, estudiante_id) VALUES (2, 1);