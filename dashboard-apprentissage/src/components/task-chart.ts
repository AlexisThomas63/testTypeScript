/**
 * src/components/task-chart.ts — Web Component Lit avec Chart.js
 *
 * ── Chart.js ────────────────────────────────────────────────────────────────
 * Chart.js est une bibliothèque de graphiques qui rend sur un élément <canvas>.
 * Elle est modulaire : on importe et enregistre uniquement les modules nécessaires
 * pour réduire la taille du bundle (tree-shaking).
 *
 * Modules Chart.js :
 *   - Controllers : PieController, BarController, LineController...
 *   - Elements    : ArcElement (secteurs), BarElement, PointElement...
 *   - Scales      : LinearScale, CategoryScale...
 *   - Plugins     : Tooltip, Legend, Title...
 */

import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import {
  Chart,
  ArcElement,       // Élément graphique pour les secteurs (pie/doughnut)
  PieController,    // Logique du graphique camembert
  Tooltip,          // Plugin d'info-bulle au survol
  Legend,           // Plugin de légende
  type ChartData,
} from 'chart.js';

// On enregistre les modules qu'on utilise.
// Sans ça, Chart.js ne sait pas quoi dessiner.
// Alternative : Chart.register(...registerables) pour tout importer (plus lourd)
Chart.register(ArcElement, PieController, Tooltip, Legend);

interface Task {
  id: number;
  status: 'todo' | 'done';
}

@customElement('task-chart')
export class TaskChart extends LitElement {
  override createRenderRoot(): HTMLElement {
    return this; // Light DOM pour que le canvas soit accessible normalement
  }

  // On stocke le nombre de tâches pour l'afficher dans le titre
  @state() private totalTasks = 0;
  @state() private doneTasks = 0;

  // Référence à l'instance Chart pour pouvoir la détruire si besoin
  private chart?: Chart;

  override async firstUpdated(): Promise<void> {
    const tasks: Task[] = await fetch('/api/tasks').then((r) => r.json());

    this.doneTasks = tasks.filter((t) => t.status === 'done').length;
    const todoTasks = tasks.filter((t) => t.status === 'todo').length;
    this.totalTasks = tasks.length;

    // Récupère le canvas sur lequel Chart.js va dessiner
    const canvas = this.querySelector<HTMLCanvasElement>('#task-chart-canvas')!;

    const data: ChartData<'pie'> = {
      labels: ['✅ Terminées', '⏳ À faire'],
      datasets: [
        {
          data: [this.doneTasks, todoTasks],
          backgroundColor: [
            '#4ade80', // vert pour "done"
            '#fb923c', // orange pour "todo"
          ],
          borderColor: ['#16a34a', '#ea580c'],
          borderWidth: 2,
        },
      ],
    };

    /**
     * new Chart(canvas, config) — Crée et dessine le graphique.
     *
     * La config suit la structure :
     * {
     *   type    : le type de graphique ('pie', 'bar', 'line', 'doughnut'...)
     *   data    : les données { labels, datasets }
     *   options : configuration visuelle et comportementale
     * }
     */
    this.chart = new Chart(canvas, {
      type: 'pie',
      data,
      options: {
        responsive: true,   // S'adapte à la taille du conteneur
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',  // Légende en bas du graphique
          },
          tooltip: {
            // Personnalise le texte de l'info-bulle
            callbacks: {
              label: (ctx) => {
                const pct = Math.round((ctx.parsed / this.totalTasks) * 100);
                return ` ${ctx.parsed} tâche(s) — ${pct}%`;
              },
            },
          },
        },
      },
    });
  }

  /**
   * disconnectedCallback() — Cycle de vie : appelé quand le composant
   * est retiré du DOM.
   * On détruit le graphique pour libérer la mémoire du canvas.
   */
  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this.chart?.destroy();
  }

  override render() {
    return html`
      <div class="widget-title">📊 Progression</div>
      <div class="chart-subtitle">
        ${this.doneTasks} / ${this.totalTasks} tâches terminées
      </div>
      <!-- Chart.js s'attache à ce canvas -->
      <div style="position:relative; height:260px">
        <canvas id="task-chart-canvas"></canvas>
      </div>
    `;
  }
}
