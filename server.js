const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Permite que la App React se conecte
app.use(bodyParser.json());

// --- BASE DE DATOS SQLITE ---
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) console.error('Error al abrir la BD', err);
  else {
    console.log('Conectado a la base de datos SQLite.');
    crearTablas();
  }
});

function crearTablas() {
  // 1. Tabla de USUARIOS
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT
  )`, () => {
    // Insertar usuario Admin por defecto si no existe
    db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin')`);
  });

  // 2. Tabla de DISPOSITIVOS (Tus Arduinos)
  db.run(`CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    ip TEXT,
    location TEXT,
    type TEXT
  )`);
}

// --- RUTAS DE LA API (ENDPOINTS) ---

// 1. LOGIN (Verificar usuario)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row) {
      res.json({ success: true, user: { id: row.id, name: row.username, role: row.role } });
    } else {
      res.status(401).json({ success: false, message: "Credenciales incorrectas" });
    }
  });
});

// 2. OBTENER DISPOSITIVOS (Para mostrar en el Dashboard)
app.get('/api/devices', (req, res) => {
  db.all("SELECT * FROM devices", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 3. AGREGAR NUEVO DISPOSITIVO (Configuración)
app.post('/api/devices', (req, res) => {
  const { name, ip, location, type } = req.body;
  db.run("INSERT INTO devices (name, ip, location, type) VALUES (?, ?, ?, ?)", 
    [name, ip, location, type], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, message: "Dispositivo agregado" });
    }
  );
});

// 4. ELIMINAR DISPOSITIVO
app.delete('/api/devices/:id', (req, res) => {
  const id = req.params.id;
  db.run("DELETE FROM devices WHERE id = ?", id, function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Dispositivo eliminado" });
  });
});

// Iniciar Servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
  console.log(`Usuario por defecto: admin / admin123`);
});