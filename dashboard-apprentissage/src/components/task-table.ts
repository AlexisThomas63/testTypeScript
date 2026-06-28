/**
 * src/components/task-table.ts — Web Component Lit avec Tabulator
 *
 * ── Lit v3 ──────────────────────────────────────────────────────────────────
 * Lit est une bibliothèque pour créer des Web Components standards.
 * Un Web Component est un élément HTML personnalisé (<task-table>)
 * reconnu nativement par le navigateur, réutilisable dans n'importe quel
 * framework (ou sans framework).
 *
 * Lit ajoute :
 *   - @customElement  : décorateur qui enregistre l'élément via customElements.define()
 *   - @state          : propriété réactive → un changement déclenche un re-render
 *   - @property       : propriété exposée comme attribut HTML
 *   - html``          : tag template pour le rendu déclaratif
 *   - LitElement      : classe de base avec le cycle de vie du composant
 *
 * ── Tabulator ───────────────────────────────────────────────────────────────
 * Tabulator est une bibliothèque de tableaux interactifs.
 * Elle gère : tri, filtrage, pagination, édition en ligne, colonnes personnalisées.
 * Elle s'attache à un élément DOM existant.
 */

import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { TabulatorFull as Tabulator, type ColumnDefinition } from 'tabulator-tables';

// Import du CSS de Tabulator — Vite le traite comme un module CSS global
import 'tabulator-tables/dist/css/tabulator.min.css';

// Interface TypeScript décrivant la forme d'une tâche
interface Task {
  id: number;
  title: string;
  status: 'todo' | 'done';
  created_at: string;
}

/**
 * @customElement('task-table')
 * Enregistre ce composant comme <task-table> dans le registre des custom elements.
 * Équivalent à : customElements.define('task-table', TaskTable)
 */
@customElement('task-table')
export class TaskTable extends LitElement {
  /**
   * createRenderRoot() — Contrôle où Lit rend le template.
   *
   * Par défaut, Lit utilise un Shadow DOM (DOM isolé avec styles encapsulés).
   * On retourne `this` pour utiliser le Light DOM (DOM normal) à la place.
   *
   * Pourquoi ? Tabulator injecte ses propres styles CSS dans le document.
   * Avec Shadow DOM, ces styles ne traverseraient pas la frontière d'isolation.
   */
  override createRenderRoot(): HTMLElement {
    return this;
  }

  /**
   * @state() — Propriété réactive locale au composant.
   * Chaque fois que `newTitle` change, Lit re-rend le template automatiquement.
   * Contrairement à @property, @state n'est pas exposé comme attribut HTML.
   */
  @state() private newTitle = '';

  // Instance Tabulator — on la garde pour pouvoir appeler ses méthodes plus tard
  private tabulator?: Tabulator;

  /**
   * firstUpdated() — Cycle de vie Lit.
   * Appelé UNE SEULE FOIS, après le premier rendu, quand le DOM est prêt.
   * C'est ici qu'on initialise les bibliothèques qui ont besoin d'un élément DOM réel.
   *
   * Ordre des cycles de vie Lit :
   *   constructor → connectedCallback → render → firstUpdated → updated (à chaque render)
   */
  override async firstUpdated(): Promise<void> {
    await this.initTabulator();
  }

  private async initTabulator(): Promise<void> {
    // Fetch des données depuis l'API Express
    const tasks: Task[] = await fetch('/api/tasks').then((r) => r.json());

    // Définition des colonnes Tabulator
    // Chaque colonne a un `field` qui correspond à une clé de l'objet de données
    const columns: ColumnDefinition[] = [
      {
        title: '#',
        field: 'id',
        width: 50,
        hozAlign: 'center',
      },
      {
        title: 'Tâche',
        field: 'title',
        // editor: 'input' rend cette cellule éditable (double-clic)
        editor: 'input',
        widthGrow: 3, // prend 3x plus de place que les autres colonnes flexibles
      },
      {
        title: 'Statut',
        field: 'status',
        width: 130,
        // editor: 'list' = menu déroulant pour choisir parmi des valeurs prédéfinies
        editor: 'list',
        editorParams: { values: ['todo', 'done'] },
        // formatter : personnalise le rendu HTML d'une cellule
        formatter: (cell) => {
          const val = cell.getValue() as string;
          return val === 'done'
            ? '<span style="color:#16a34a;font-weight:600">✅ done</span>'
            : '<span style="color:#ea580c;font-weight:600">⏳ todo</span>';
        },
        // cellEdited : callback appelé après qu'une cellule est modifiée
        cellEdited: async (cell) => {
          const row = cell.getRow().getData() as Task;
          await fetch(`/api/tasks/${row.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: row.status }),
          });
        },
      },
      {
        title: '',
        field: 'id',
        width: 50,
        hozAlign: 'center',
        // formatter qui renvoie juste une icône — pas de `field` significatif
        formatter: () => '🗑️',
        // cellClick : callback au clic sur cette cellule
        cellClick: async (_e, cell) => {
          const { id } = cell.getRow().getData() as Task;
          await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
          // Tabulator API : supprime la ligne du tableau sans recharger
          cell.getRow().delete();
        },
      },
    ];

    // Initialisation de Tabulator sur l'élément #task-grid
    // querySelector cherche dans le Light DOM de ce composant
    this.tabulator = new Tabulator(this.querySelector('#task-grid')!, {
      data: tasks,
      columns,
      layout: 'fitColumns',    // Les colonnes occupent toute la largeur
      height: '280px',          // Hauteur fixe avec scroll vertical
      placeholder: 'Aucune tâche — ajoutez-en une !',
    });
  }

  private async addTask(): Promise<void> {
    const title = this.newTitle.trim();
    if (!title) return;

    const task: Task = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    }).then((r) => r.json());

    // Tabulator API : ajoute une ligne en tête de tableau sans re-fetch
    this.tabulator?.addRow(task, true);

    // Réinitialise le champ — @state déclenche un re-render
    this.newTitle = '';
  }

  /**
   * render() — Retourne le template HTML du composant.
   *
   * html`` est un tag template Lit. Il parse le HTML et crée un TemplateResult.
   * Lit fait du rendu différentiel : il ne met à jour que les parties qui ont changé
   * (comme React, mais sans Virtual DOM — directement dans le DOM réel).
   *
   * Syntaxe des bindings Lit :
   *   .value=${x}       → property binding (équivalent à element.value = x)
   *   @click=${fn}      → event listener
   *   ?disabled=${bool} → attribut booléen
   *   ${expr}           → interpolation de texte ou template
   */
  override render() {
    return html`
      <div class="widget-title">📋 Tâches</div>

      <!-- Formulaire d'ajout de tâche -->
      <div class="add-form">
        <input
          type="text"
          class="task-input"
          placeholder="Nouvelle tâche..."
          .value=${this.newTitle}
          @input=${(e: Event) => {
            // On lit la valeur depuis l'événement DOM et on met à jour @state
            this.newTitle = (e.target as HTMLInputElement).value;
          }}
          @keydown=${(e: KeyboardEvent) => {
            // Raccourci clavier : Entrée = ajouter
            if (e.key === 'Enter') this.addTask();
          }}
        />
        <button class="btn-add" @click=${this.addTask}>+ Ajouter</button>
      </div>

      <!-- Tabulator s'attache à cet élément dans firstUpdated() -->
      <div id="task-grid"></div>
    `;
  }
}
