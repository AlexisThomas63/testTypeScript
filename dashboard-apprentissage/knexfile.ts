/**
 * knexfile.ts — Configuration de Knex.js
 *
 * Ce fichier est utilisé par la CLI Knex (npx knex migrate:latest)
 * et par notre code serveur pour initialiser la connexion BDD.
 *
 * Knex supporte plusieurs clients SQL :
 *   - 'better-sqlite3' : SQLite local, parfait pour apprendre (pas de serveur)
 *   - 'pg'             : PostgreSQL
 *   - 'mysql2'         : MySQL / MariaDB
 *   - 'mssql'          : SQL Server
 */

import type { Knex } from 'knex';

const config: Knex.Config = {
  // Client SQLite via better-sqlite3 (synchrone, très rapide)
  client: 'better-sqlite3',

  connection: {
    // Chemin vers le fichier de base de données SQLite
    // SQLite stocke toute la BDD dans un seul fichier .sqlite3
    filename: './db.sqlite3',
  },

  // SQLite ne supporte pas les valeurs DEFAULT pour certaines colonnes
  // sans ce flag, Knex lèverait des erreurs lors des inserts
  useNullAsDefault: true,

  migrations: {
    // Dossier contenant les fichiers de migration
    directory: './server/migrations',
  },
};

export default config;
