const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');

const app = express();
const db = new Database(path.join(__dirname, 'taskflow.db'));
const JWT_SECRET = process.env.JWT_SECRET || 'development-only-change-me';
const PORT = process.env.PORT || 3000;

db.pragma('journal_mode = WAL');
db.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL, created_at TEXT DEFAULT CURRENT_TIMESTAMP); CREATE TABLE IF NOT EXISTS tasks (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, title TEXT NOT NULL, priority TEXT NOT NULL DEFAULT 'medium', completed INTEGER NOT NULL DEFAULT 0, created_at TEXT DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);`);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function tokenFor(user) { return jwt.sign({ sub: user.id, email: user.email }, JWT_SECRET, { expiresIn: '2h' }); }
function auth(req, res, next) { try { const h = req.headers.authorization || ''; if (!h.startsWith('Bearer ')) return res.status(401).json({error:'Authentication required'}); req.user = jwt.verify(h.slice(7), JWT_SECRET); next(); } catch { res.status(401).json({error:'Invalid or expired session'}); } }
function validEmail(email) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

app.post('/api/auth/register', async (req,res) => { const name=String(req.body.name||'').trim(); const email=String(req.body.email||'').trim().toLowerCase(); const password=String(req.body.password||''); if(name.length<2||!validEmail(email)||password.length<8) return res.status(400).json({error:'Name, valid email and password (8+ characters) are required'}); try { const hash=await bcrypt.hash(password,12); const info=db.prepare('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)').run(name,email,hash); const user={id:Number(info.lastInsertRowid),name,email}; res.status(201).json({user,token:tokenFor(user)}); } catch(e) { if(String(e.message).includes('UNIQUE')) return res.status(409).json({error:'Email already registered'}); res.status(500).json({error:'Could not create account'}); } });
app.post('/api/auth/login', async (req,res) => { const email=String(req.body.email||'').trim().toLowerCase(); const password=String(req.body.password||''); const user=db.prepare('SELECT id,name,email,password_hash FROM users WHERE email=?').get(email); if(!user || !(await bcrypt.compare(password,user.password_hash))) return res.status(401).json({error:'Invalid email or password'}); const clean={id:user.id,name:user.name,email:user.email}; res.json({user:clean,token:tokenFor(clean)}); });
app.get('/api/me',auth,(req,res)=>{ const user=db.prepare('SELECT id,name,email FROM users WHERE id=?').get(req.user.sub); if(!user) return res.status(404).json({error:'User not found'}); res.json({user}); });
app.get('/api/tasks',auth,(req,res)=>res.json({tasks:db.prepare('SELECT id,title,priority,completed,created_at FROM tasks WHERE user_id=? ORDER BY completed ASC,id DESC').all(req.user.sub)}));
app.post('/api/tasks',auth,(req,res)=>{ const title=String(req.body.title||'').trim(); const priority=['low','medium','high'].includes(req.body.priority)?req.body.priority:'medium'; if(!title||title.length>120) return res.status(400).json({error:'Task title must be 1–120 characters'}); const info=db.prepare('INSERT INTO tasks(user_id,title,priority) VALUES(?,?,?)').run(req.user.sub,title,priority); res.status(201).json({task:db.prepare('SELECT id,title,priority,completed,created_at FROM tasks WHERE id=?').get(info.lastInsertRowid)}); });
app.patch('/api/tasks/:id',auth,(req,res)=>{ const id=Number(req.params.id); const task=db.prepare('SELECT * FROM tasks WHERE id=? AND user_id=?').get(id,req.user.sub); if(!task) return res.status(404).json({error:'Task not found'}); if(typeof req.body.completed==='boolean') db.prepare('UPDATE tasks SET completed=? WHERE id=? AND user_id=?').run(req.body.completed?1:0,id,req.user.sub); if(req.body.priority && ['low','medium','high'].includes(req.body.priority)) db.prepare('UPDATE tasks SET priority=? WHERE id=? AND user_id=?').run(req.body.priority,id,req.user.sub); res.json({task:db.prepare('SELECT id,title,priority,completed,created_at FROM tasks WHERE id=?').get(id)}); });
app.delete('/api/tasks/:id',auth,(req,res)=>{ const result=db.prepare('DELETE FROM tasks WHERE id=? AND user_id=?').run(Number(req.params.id),req.user.sub); if(!result.changes) return res.status(404).json({error:'Task not found'}); res.status(204).end(); });

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT,()=>console.log(`TaskFlow running on http://localhost:${PORT}`));