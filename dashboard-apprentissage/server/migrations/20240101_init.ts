/**
 * server/migrations/20240101_init.ts — Migration initiale
 *
 * Une migration Knex est un fichier avec deux exports :
 *   - up()   : applique la modification (CREATE TABLE, ALTER TABLE, etc.)
 *   - down() : annule la modification (DROP TABLE, etc.) pour les rollbacks
 *
 * Knex exécute les migrations dans l'ordre alphabétique/chronologique
 * du nom de fichier. La convention est de préfixer avec une date : YYYYMMDD_nom
 *
 * Commande CLI pour appliquer : npx knex migrate:latest
 * Commande CLI pour rollback  : npx knex migrate:rollback
 * (Dans ce projet, les migrations sont appliquées automatiquement au démarrage)
 */

import type { Knex } from 'knex';

// ─── up : création du schéma initial ─────────────────────────────────────────

export async function up(knex: Knex): Promise<void> {
  /**
   * table 'tasks' — stocke les tâches de l'utilisateur
   *
   * knex.schema.createTable() génère un CREATE TABLE SQL.
   * Le callback reçoit un TableBuilder avec des méthodes pour chaque type de colonne.
   */
  await knex.schema.createTable('tasks', (table) => {
    // Clé primaire auto-incrémentée (INTEGER PRIMARY KEY AUTOINCREMENT en SQLite)
    table.increments('id').primary();

    // VARCHAR NOT NULL — le titre de la tâche
    table.string('title').notNullable();

    // VARCHAR avec valeur par défaut — statut : 'todo' ou 'done'
    table.string('status').defaultTo('todo');

    // Raccourci Knex : crée created_at et updated_at (DATETIME)
    // Le deuxième argument 'true' met à jour updated_at automatiquement
    table.timestamps(true, true);
  });

  /**
   * table 'notes' — stocke des notes en format Markdown
   */
  await knex.schema.createTable('notes', (table) => {
    table.increments('id').primary();

    // TEXT — contenu Markdown (potentiellement long, pas de limite VARCHAR)
    table.text('content').defaultTo('');

    table.timestamps(true, true);
  });

  // ── Données de démonstration ──────────────────────────────────────────────

  // knex('tasks').insert() génère un INSERT INTO tasks (...) VALUES (...)
  await knex('tasks').insert([
    { title: 'Apprendre Lit v3 (Web Components)', status: 'done' },
    { title: 'Configurer Vite comme bundler', status: 'done' },
    { title: 'Écrire une migration Knex', status: 'done' },
    { title: 'Afficher des données avec Tabulator', status: 'todo' },
    { title: 'Créer un graphique avec Chart.js', status: 'todo' },
    { title: 'Rendre du Markdown avec Marked', status: 'todo' },
    { title: 'Organiser les widgets avec GridStack', status: 'todo' },
  ]);

  await knex('notes').insert([
    {
      content: [
        '# 📚 Dashboard Apprentissage',
        '',
        'Bienvenue ! Cette note est rendue par **Marked.js** à partir de Markdown brut.',
        '',
        '## Technologies du projet',
        '',
        '| Tech | Rôle |',
        '|------|------|',
        '| **Lit v3** | Web Components réactifs |',
        '| **GridStack** | Mise en page drag & drop |',
        '| **Tabulator** | Tableaux de données interactifs |',
        '| **Chart.js** | Graphiques et visualisations |',
        '| **Marked** | Rendu Markdown → HTML |',
        '| **Knex.js** | Query builder + migrations SQL |',
        '| **Vite** | Bundler ultra-rapide |',
        '| **TypeScript** | Typage statique |',
        '',
        '## Comment utiliser cette note',
        '',
        'Cliquez sur **✏️ Éditer** pour modifier le contenu en Markdown.',
        'Cliquez sur **💾 Sauvegarder** pour persister en base de données.',
        '',
        '> 💡 *Essayez de déplacer et redimensionner les widgets avec la souris !*',
      ].join('\n'),
    },
  ]);
}

// ─── down : rollback (suppression du schéma) ─────────────────────────────────

export async function down(knex: Knex): Promise<void> {
  // On supprime dans l'ordre inverse de la création (respect des FK éventuelles)
  await knex.schema.dropTableIfExists('notes');
  await knex.schema.dropTableIfExists('tasks');
}
