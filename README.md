# Servidor IoT

Este es un servidor simple para un sistema IoT que gestiona usuarios y dispositivos. Está construido con Node.js, Express y SQLite.

## Características

- Autenticación de usuarios.
- Gestión de dispositivos (CRUD).
- Base de datos SQLite para persistencia de datos.

## Prerrequisitos

- Node.js (v14 o superior)
- npm

## Instalación

1. Clona este repositorio:
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   ```
2. Navega al directorio del proyecto:
   ```bash
   cd servidor-iot
   ```
3. Instala las dependencias:
   ```bash
   npm install
   ```

## Uso

Para iniciar el servidor, ejecuta:

```bash
npm start
```

El servidor se iniciará en `http://localhost:3000`.

### Usuario por Defecto

- **Usuario:** `admin`
- **Contraseña:** `admin123`

## API Endpoints

- **POST /api/login**: Autentica a un usuario.
  - **Body**: `{ "username": "...", "password": "..." }`
- **GET /api/devices**: Obtiene la lista de todos los dispositivos.
- **POST /api/devices**: Agrega un nuevo dispositivo.
  - **Body**: `{ "name": "...", "ip": "...", "location": "...", "type": "..." }`
- **DELETE /api/devices/:id**: Elimina un dispositivo por su ID.

## Dependencias

- [express](https://expressjs.com/): Framework web para Node.js.
- [sqlite3](https://github.com/TryGhost/node-sqlite3): Driver de SQLite para Node.js.
- [cors](https://github.com/expressjs/cors): Middleware para habilitar CORS.
- [body-parser](https://github.com/expressjs/body-parser): Middleware para parsear el body de las peticiones.
