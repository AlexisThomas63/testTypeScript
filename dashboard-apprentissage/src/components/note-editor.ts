/**
 * src/components/note-editor.ts — Web Component Lit avec Marked
 *
 * ── Marked ───────────────────────────────────────────────────────────────────
 * Marked est un parseur Markdown → HTML très léger et rapide.
 * Il convertit du texte Markdown (# Titre, **gras**, - liste...) en HTML valide.
 *
 * Usage simple :
 *   import { marked } from 'marked';
 *   const html = await marked.parse('# Bonjour\nMonde **gras**');
 *   // → '<h1>Bonjour</h1>\n<p>Monde <strong>gras</strong></p>'
 *
 * On peut configurer des options (sanitize, gfm, breaks...) et
 * même étendre le parseur avec des extensions personnalisées.
 *
 * ── Lit : rendu conditionnel ─────────────────────────────────────────────────
 * Ce composant illustre le rendu conditionnel avec Lit :
 * le template change selon que l'utilisateur est en mode édition ou lecture.
 */

import { LitElement, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { marked, type MarkedOptions } from 'marked';

// Configuration de Marked
// gfm = GitHub Flavored Markdown (tableaux, barré, etc.)
// breaks = les retours à la ligne simples créent des <br>
const markedOptions: MarkedOptions = {
  gfm: true,
  breaks: false,
  async: false, // On utilise le mode synchrone pour simplifier
};

@customElement('note-editor')
export class NoteEditor extends LitElement {
  override createRenderRoot(): HTMLElement {
    return this;
  }

  // Contenu Markdown brut (ce qui est stocké en BDD et affiché dans le textarea)
  @state() private content = '';

  // true = textarea visible, false = HTML rendu visible
  @state() private editMode = false;

  // true pendant la sauvegarde → désactive le bouton pour éviter les doubles envois
  @state() private saving = false;

  override async firstUpdated(): Promise<void> {
    const note = await fetch('/api/notes/1').then((r) => r.json());
    // On initialise le contenu avec ce qui vient de la BDD
    this.content = (note.content as string) ?? '';
  }

  private async save(): Promise<void> {
    this.saving = true;
    await fetch('/api/notes/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: this.content }),
    });
    this.saving = false;
    // Retour en mode lecture après sauvegarde
    this.editMode = false;
  }

  /**
   * parseMarkdown() — Convertit le Markdown en HTML via Marked.
   *
   * marked.parse() en mode synchrone (async: false) retourne directement
   * un string HTML. En mode async (par défaut), il retourne une Promise<string>.
   *
   * IMPORTANT sécurité : marked.parse() n'assainit PAS le HTML par défaut.
   * En production, utiliser DOMPurify pour éviter les attaques XSS :
   *   import DOMPurify from 'dompurify';
   *   const safeHtml = DOMPurify.sanitize(marked.parse(content));
   */
  private parseMarkdown(source: string): string {
    return marked.parse(source, markedOptions) as string;
  }

  override render() {
    return html`
      <div class="widget-title">
        📝 Notes Markdown
        <button
          class="btn-toggle"
          @click=${() => { this.editMode = !this.editMode; }}
        >
          ${this.editMode ? '👁️ Aperçu' : '✏️ Éditer'}
        </button>
      </div>

      <!-- Rendu conditionnel Lit : on alterne entre deux templates -->
      ${this.editMode
        ? html`
            <!-- Mode édition : textarea avec le Markdown brut -->
            <textarea
              class="md-textarea"
              .value=${this.content}
              @input=${(e: Event) => {
                // Mise à jour du @state à chaque frappe → aperçu temps réel possible
                this.content = (e.target as HTMLTextAreaElement).value;
              }}
              placeholder="Écrivez du Markdown ici..."
              spellcheck="false"
            ></textarea>
            <div class="note-actions">
              <button
                class="btn-save"
                @click=${this.save}
                ?disabled=${this.saving}
              >
                ${this.saving ? '⏳ Sauvegarde...' : '💾 Sauvegarder'}
              </button>
              <span class="md-hint">
                Supporte GFM : **gras**, *italique*, # titres, | tableaux |, \`code\`
              </span>
            </div>
          `
        : html`
            <!--
              Mode lecture : HTML rendu par Marked.
              .innerHTML=${...} = property binding Lit
              Lit injecte directement le HTML parsé dans le DOM.
            -->
            <div
              class="md-preview"
              .innerHTML=${this.parseMarkdown(this.content || '*Aucun contenu — cliquez sur Éditer*')}
            ></div>
          `}
    `;
  }
}
