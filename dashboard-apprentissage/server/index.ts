/**
 * server/index.ts — Serveur Express avec API REST
 *
 * Express est un framework web minimaliste pour Node.js.
 * On l'utilise ici pour exposer une API JSON consommée par le frontend Vite.
 *
 * Architecture :
 *   Browser (Vite:5173) → /api/* → Proxy Vite → Express (localhost:3000)
 *
 * Le proxy Vite (vite.config.ts) évite les problèmes CORS en dev.
 */

import express from 'express';
import { db, runMigrations } from './db.js';

const app = express();

// Middleware pour parser automatiquement le body JSON des requêtes POST/PUT
app.use(express.json());

// ── Routes /api/tasks ─────────────────────────────────────────────────────────

/**
 * GET /api/tasks
 * Renvoie la liste de toutes les tâches, triées par date de création (récentes en premier)
 */
app.get('/api/tasks', async (req, res) => {
  // db('tasks') = knex.table('tasks')
  // .select('*') = SELECT * FROM tasks
  // .orderBy('created_at', 'desc') = ORDER BY created_at DESC
  const tasks = await db('tasks').select('*').orderBy('created_at', 'desc');
  res.json(tasks);
});

/**
 * POST /api/tasks
 * Crée une nouvelle tâche
 * Body attendu : { title: string }
 */
app.post('/api/tasks', async (req, res) => {
  const { title } = req.body as { title: string };

  // .insert() renvoie un tableau avec l'ID généré (comportement SQLite avec Knex)
  const [id] = await db('tasks').insert({ title });

  // On re-fetch la tâche créée pour renvoyer l'objet complet avec timestamps
  const task = await db('tasks').where({ id }).first();
  res.status(201).json(task);
});

/**
 * PUT /api/tasks/:id
 * Met à jour le statut d'une tâche
 * Body attendu : { status: 'todo' | 'done' }
 */
app.put('/api/tasks/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { status } = req.body as { status: string };

  // .where({ id }) = WHERE id = ?  (Knex utilise des requêtes paramétrées pour éviter les injections SQL)
  // .update({ status }) = SET status = ?
  await db('tasks').where({ id }).update({ status, updated_at: new Date().toISOString() });

  const task = await db('tasks').where({ id }).first();
  res.json(task);
});

/**
 * DELETE /api/tasks/:id
 * Supprime une tâche par son ID
 */
app.delete('/api/tasks/:id', async (req, res) => {
  const id = Number(req.params.id);
  await db('tasks').where({ id }).delete();
  res.json({ ok: true });
});

// ── Routes /api/notes ─────────────────────────────────────────────────────────

/**
 * GET /api/notes/:id
 * Récupère une note par son ID
 */
app.get('/api/notes/:id', async (req, res) => {
  const id = Number(req.params.id);

  // .first() = LIMIT 1, renvoie un objet ou undefined (jamais un tableau)
  const note = await db('notes').where({ id }).first();

  if (!note) {
    // 404 si la note n'existe pas
    res.status(404).json({ error: 'Note non trouvée' });
    return;
  }
  res.json(note);
});

/**
 * PUT /api/notes/:id
 * Sauvegarde le contenu Markdown d'une note
 * Body attendu : { content: string }
 */
app.put('/api/notes/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { content } = req.body as { content: string };

  await db('notes').where({ id }).update({ content, updated_at: new Date().toISOString() });
  res.json({ ok: true });
});

// ── Démarrage ─────────────────────────────────────────────────────────────────

async function start(): Promise<void> {
  // On applique les migrations AVANT d'écouter les requêtes
  // Ça garantit que le schéma est à jour dès le premier appel API
  await runMigrations();

  app.listen(3000, () => {
    console.log('🚀 Serveur Express démarré sur http://localhost:3000');
    console.log('   Frontend Vite prévu sur  http://localhost:5173');
  });
}

start().catch(console.error);
