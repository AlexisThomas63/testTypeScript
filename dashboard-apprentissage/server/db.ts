/**
 * server/db.ts — Connexion à la base de données via Knex.js
 *
 * Knex.js est un "query builder" SQL : il permet d'écrire des requêtes
 * SQL de façon programmatique en TypeScript, sans écrire du SQL brut.
 *
 * Il gère aussi les migrations : des fichiers versionnés qui décrivent
 * l'évolution du schéma de la base de données.
 */

import knex from 'knex';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// En ESM, __dirname n'existe pas : on le reconstruit à partir de import.meta.url
const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Instance Knex partagée dans tout le serveur.
 * On crée UNE SEULE connexion et on l'exporte pour la réutiliser.
 */
export const db = knex({
  client: 'better-sqlite3',

  connection: {
    // join() garantit un chemin absolu, quelle que soit l'origine du process
    filename: join(__dirname, '..', 'db.sqlite3'),
  },

  // Nécessaire avec SQLite pour éviter les erreurs sur les colonnes sans valeur par défaut
  useNullAsDefault: true,
});

/**
 * runMigrations() — Applique toutes les migrations non encore exécutées.
 *
 * Knex maintient une table interne `knex_migrations` qui liste
 * les migrations déjà appliquées. Ça garantit qu'on n'exécute
 * chaque migration qu'une seule fois.
 *
 * Appelé au démarrage du serveur pour que le schéma soit toujours à jour.
 */
export async function runMigrations(): Promise<void> {
  await db.migrate.latest({
    directory: join(__dirname, 'migrations'),
  });
  console.log('✅ Migrations Knex appliquées');
}
