const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(bodyParser.json());

// --- BASE DE DATOS ---
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) console.error(err);
  else {
    console.log('✅ DB Conectada. Sistema listo.');
    crearTablas();
  }
});

function crearTablas() {
  // Tabla Usuarios
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    username TEXT UNIQUE, 
    password TEXT, 
    role TEXT
  )`);
  // Admin por defecto
  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', 'admin123', 'admin')`);

  // Tabla Dispositivos (Con nombres de botones individuales)
  db.run(`CREATE TABLE IF NOT EXISTS devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, ip TEXT, location TEXT, type TEXT, status TEXT DEFAULT '0', 
    d4_name TEXT DEFAULT 'Luz', d5_name TEXT DEFAULT 'Ventilador', 
    d6_name TEXT DEFAULT 'Patio', d7_name TEXT DEFAULT 'Auxiliar',
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  // Tabla Historial
  db.run(`CREATE TABLE IF NOT EXISTS action_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    user_id INTEGER, action TEXT, target_type TEXT, target_id INTEGER, 
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
}

// --- MIDDLEWARE DE ROLES ---
const checkAdmin = (req, res, next) => {
    const userId = req.headers['x-user-id'];
    if (!userId) return next(); 
    db.get("SELECT role FROM users WHERE id = ?", [userId], (err, row) => {
        if(row && row.role === 'admin') req.isAdmin = true;
        else req.isAdmin = false;
        next();
    });
};
app.use(checkAdmin);

// --- RUTAS AUTH ---
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, row) => {
    if (row) res.json({ success: true, user: { id: row.id, name: row.username, role: row.role } });
    else res.status(401).json({ success: false, message: "Credenciales incorrectas" });
  });
});

// --- RUTAS DISPOSITIVOS ---
app.get('/api/devices', (req, res) => {
  db.all("SELECT * FROM devices", [], (err, rows) => res.json(rows));
});

app.post('/api/devices', (req, res) => {
  if(!req.isAdmin) return res.status(403).json({error:"Requiere Admin"});
  const { name, ip, location, d4_name, d5_name, d6_name, d7_name } = req.body;
  db.run("INSERT INTO devices (name, ip, location, d4_name, d5_name, d6_name, d7_name, status) VALUES (?,?,?,?,?,?,?, '0')", 
      [name, ip, location, d4_name, d5_name, d6_name, d7_name], 
      function(err) { res.json({ id: this.lastID }); }
  );
});

app.put('/api/devices/:id', (req, res) => {
    if(!req.isAdmin) return res.status(403).json({error:"Requiere Admin"});
    const { name, ip, location, d4_name, d5_name, d6_name, d7_name } = req.body;
    db.run("UPDATE devices SET name=?, ip=?, location=?, d4_name=?, d5_name=?, d6_name=?, d7_name=? WHERE id=?", 
      [name, ip, location, d4_name, d5_name, d6_name, d7_name, req.params.id], 
      () => res.json({message:"Actualizado"})
    );
});

app.delete('/api/devices/:id', (req, res) => {
    if(!req.isAdmin) return res.status(403).json({error:"Requiere Admin"});
    db.run("DELETE FROM devices WHERE id = ?", [req.params.id], () => res.json({message:"Borrado"}));
});

app.put('/api/devices/:id/status', (req, res) => {
    const { status } = req.body;
    db.run("UPDATE devices SET status = ? WHERE id = ?", [status, req.params.id], () => res.json({msg:"Ok"}));
});

// --- RUTAS USUARIOS ---
app.get('/api/users', (req, res) => {
    if(!req.isAdmin) return res.status(403).json({error:"Requiere Admin"});
    db.all("SELECT id, username, role FROM users", [], (err, rows) => res.json(rows));
});

app.post('/api/users', (req, res) => {
    if(!req.isAdmin) return res.status(403).json({error:"Requiere Admin"});
    const { username, password, role } = req.body;
    db.run("INSERT INTO users (username, password, role) VALUES (?,?,?)", [username, password, role], 
        (err) => err ? res.status(500).json({error:"Error"}) : res.json({message:"Creado"})
    );
});

app.put('/api/users/:id', (req, res) => {
    const targetId = parseInt(req.params.id);
    const requesterId = parseInt(req.headers['x-user-id']);
    // Permiso: Admin o el mismo usuario
    if(!req.isAdmin && targetId !== requesterId) return res.status(403).json({error:"Prohibido"});

    const { username, password, role } = req.body;
    let sql = "UPDATE users SET ";
    let params = [];

    if(req.isAdmin && username) { sql += "username=?, "; params.push(username); }
    if(req.isAdmin && role) { sql += "role=?, "; params.push(role); }
    if(password && password.length > 0) { sql += "password=?, "; params.push(password); }

    if (params.length === 0) return res.json({msg: "Nada que actualizar"});
    
    sql = sql.slice(0, -2) + " WHERE id=?";
    params.push(targetId);

    db.run(sql, params, (err) => err ? res.status(500).json({error:err.message}) : res.json({message:"Actualizado"}));
});

app.delete('/api/users/:id', (req, res) => {
    if(!req.isAdmin) return res.status(403).json({error:"Requiere Admin"});
    db.run("DELETE FROM users WHERE id=?", [req.params.id], () => res.json({message:"Borrado"}));
});

// Historial
app.get('/api/history', (req, res) => {
    if(!req.isAdmin) return res.status(403).json({error:"Requiere Admin"});
    db.all("SELECT * FROM action_history ORDER BY timestamp DESC LIMIT 50", [], (err, rows) => res.json(rows));
});

app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));