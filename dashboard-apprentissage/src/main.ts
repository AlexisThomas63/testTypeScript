/**
 * src/main.ts — Point d'entrée du frontend
 *
 * Vite charge ce fichier en premier (référencé dans index.html via <script type="module">).
 * Il est responsable de :
 *   1. Importer les Web Components pour les enregistrer dans le navigateur
 *   2. Initialiser la grille GridStack
 *   3. Injecter les composants dans les cellules de la grille
 *
 * ── GridStack ────────────────────────────────────────────────────────────────
 * GridStack est une bibliothèque de mise en page en grille.
 * Les widgets peuvent être :
 *   - Déplacés par drag & drop
 *   - Redimensionnés
 *   - Organisés sur une grille de colonnes (comme Bootstrap)
 *
 * Chaque widget a des coordonnées (x, y) et des dimensions (w, h)
 * exprimées en nombre de colonnes/rangées de la grille.
 */

// ── Import des Web Components ─────────────────────────────────────────────────
// Ces imports déclenchent l'exécution des décorateurs @customElement
// qui appellent customElements.define() — les balises sont alors reconnues par le navigateur.
// L'ordre n'a pas d'importance ici, mais ils doivent être importés avant l'usage.
import './components/task-table.js';
import './components/task-chart.js';
import './components/note-editor.js';

// ── Import GridStack ──────────────────────────────────────────────────────────
import { GridStack } from 'gridstack';

// CSS de GridStack : styles de la grille et des poignées de drag & drop
// gridstack.min.css gère jusqu'à 6 colonnes par défaut.
// Si vous utilisez plus de 6 colonnes (column:12 ici), ajoutez aussi :
//   import 'gridstack/dist/gridstack-extra.css';
// (disponible selon la version installée)
import 'gridstack/dist/gridstack.min.css';

// ── Initialisation de GridStack ───────────────────────────────────────────────

/**
 * GridStack.init() cherche l'élément .grid-stack dans le DOM
 * et le transforme en grille interactive.
 *
 * Options principales :
 *   column    : nombre de colonnes de la grille (12 = comme Bootstrap)
 *   cellHeight: hauteur d'une rangée en pixels
 *   animate   : animation CSS lors du déplacement des widgets
 *   margin    : espacement entre les widgets
 */
const grid = GridStack.init({
  column: 12,
  cellHeight: 60,       // 1 unité de hauteur = 60px
  animate: true,
  margin: 8,            // 8px entre les widgets
  resizable: {
    handles: 'se',      // Poignée de redimensionnement au coin Sud-Est uniquement
  },
  draggable: {
    handle: '.widget-title', // On peut glisser uniquement depuis le titre du widget
  },
});

/**
 * grid.addWidget() ajoute un widget à la grille.
 *
 * Propriétés de positionnement :
 *   x : colonne de départ (0-based)
 *   y : rangée de départ (0-based)
 *   w : largeur en colonnes
 *   h : hauteur en rangées (h * cellHeight = hauteur en pixels)
 *
 * La propriété `content` est une chaîne HTML injectée dans le widget.
 * Ici on injecte nos Web Components — le navigateur les "upgrade"
 * automatiquement puisqu'ils sont déjà enregistrés par les imports ci-dessus.
 */

// Widget 1 : Tableau des tâches (Tabulator) — large, à gauche
grid.addWidget({
  id: 'widget-table',
  x: 0, y: 0,
  w: 7, h: 7,
  content: '<task-table></task-table>',
});

// Widget 2 : Graphique de progression (Chart.js) — à droite du tableau
grid.addWidget({
  id: 'widget-chart',
  x: 7, y: 0,
  w: 5, h: 7,
  content: '<task-chart></task-chart>',
});

// Widget 3 : Éditeur de notes Markdown — pleine largeur, en bas
grid.addWidget({
  id: 'widget-notes',
  x: 0, y: 7,
  w: 12, h: 7,
  content: '<note-editor></note-editor>',
});

// ── Sauvegarde de la disposition ──────────────────────────────────────────────
// On écoute l'événement 'change' pour sauvegarder la disposition en localStorage
// quand l'utilisateur déplace ou redimensionne un widget.
// (Simple exemple — en prod on sauvegarderait côté serveur via l'API)
const LAYOUT_KEY = 'dashboard-layout';

// Restaure la disposition sauvegardée si elle existe
const savedLayout = localStorage.getItem(LAYOUT_KEY);
if (savedLayout) {
  try {
    grid.load(JSON.parse(savedLayout));
  } catch {
    // Layout corrompu → on ignore et on repart du layout par défaut
    localStorage.removeItem(LAYOUT_KEY);
  }
}

// Sauvegarde la disposition à chaque changement
grid.on('change', () => {
  // grid.save() retourne un tableau décrivant la position de chaque widget
  const layout = grid.save(false); // false = sans le contenu HTML
  localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
});
