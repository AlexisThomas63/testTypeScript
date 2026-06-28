/**
 * vite.config.ts — Configuration du bundler Vite
 *
 * Vite fait deux choses :
 *  1. En développement : serveur avec HMR (Hot Module Replacement) ultra-rapide
 *     Il sert les fichiers tels quels via les ES Modules natifs du navigateur
 *  2. En production (npm run build) : bundle optimisé via Rollup
 *
 * Vite gère nativement TypeScript, CSS, JSON, et les assets statiques.
 */

import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173, // Port du serveur de dev frontend

    /**
     * Proxy : redirige certaines requêtes vers un autre serveur.
     * Ici, toute requête commençant par /api est renvoyée vers
     * notre serveur Express (port 3000).
     *
     * Avantages :
     * - Pas de CORS à gérer (même origine pour le navigateur)
     * - Le frontend écrit juste fetch('/api/tasks') sans URL absolue
     */
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },

  build: {
    // On cible les navigateurs modernes qui supportent les Web Components natifs
    // et les ES Modules — pas besoin de polyfills lourds
    target: 'esnext',

    // Dossier de sortie du build de production
    outDir: 'dist',
  },
});
