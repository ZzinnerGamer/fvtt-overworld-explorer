// scripts/overworld-event-page.js
const MODULE_ID  = "overworld-explorer";

export class OverworldEventPageSheet extends foundry.applications.sheets.journal.JournalEntryPageProseMirrorSheet {
  static DEFAULT_OPTIONS = {
    classes: [MODULE_ID, "overworld-event"],
    position: { width: 720, height: 680 },
    form: { submitOnChange: false }
  };

  static VIEW_PARTS = {
    content: { template: "modules/overworld-explorer/templates/event-page-view.hbs" }
  };

  static EDIT_PARTS = {
    header: super.EDIT_PARTS.header,
    tabs:   { template: "templates/generic/tab-navigation.hbs" },
    content:{ template: "modules/overworld-explorer/templates/event-page-edit.hbs" },
    footer: super.EDIT_PARTS.footer
  };

  static TABS = {
    sheet: {
      tabs: [{ id: "content", icon: "fa-solid fa-feather" }],
      initial: "content",
      labelPrefix: "OVERWORLD.TABS"
    }
  };

  async _prepareContext(context, options) {
    context = await super._prepareContext(context, options);
    console.log("[overworld-explorer] _prepareContext", {
      isEditable: this.isEditable,
      isView: this.isView,
      parts: Object.keys(this.constructor.EDIT_PARTS || {})
    });

    context.rarityOptions = {
      common: "Common",
      uncommon: "Uncommon",
      rare: "Rare",
      unique: "Unique"
    };

    const owRaw = foundry.utils.getProperty(this.document, `flags.${MODULE_ID}`) ?? {};
    context.ow = {
      text: {
        overview:   owRaw?.text?.overview   ?? "",
        exposition: owRaw?.text?.exposition ?? "",
        summary:    owRaw?.text?.summary    ?? ""
      },
      creatures:     Array.isArray(owRaw.creatures) ? owRaw.creatures : [],
      sceneUuid:     owRaw.sceneUuid     ?? "",
      enemyRegionId: owRaw.enemyRegionId ?? "",
      allyRegionId:  owRaw.allyRegionId  ?? "",
      rarity:        owRaw.rarity        ?? "common",
      completed:     !!owRaw.completed
    };

    return context;
  }

  /** Sincroniza qué <prose-mirror> está abierto según la pestaña activa */
  _owSyncProseMirrorOpen(rootEl, activeTab) {
    const panes = rootEl.querySelectorAll('.ow-tabs-content .tab[data-tab]');
    panes.forEach(pane => {
      const isActive = pane.dataset.tab === activeTab;
      // Fallback visual, por si el tema no aplica display automáticamente:
      pane.style.display = isActive ? "" : "none";
      pane.classList.toggle("active", isActive);

      // Solo mantiene "open" el <prose-mirror> del pane activo
      pane.querySelectorAll("prose-mirror").forEach(pm => {
        pm.toggleAttribute("open", isActive);
      });
    });
  }

  activateListeners(html) {
    super.activateListeners(html);

    const rootEl = (html instanceof jQuery) ? html[0] : html;

    // --- TABS internas (usar el controlador UX moderno) ---
    try { this._owTabs?.unbind?.(rootEl); } catch {}
    try { this._owTabs?.destroy?.(); } catch {}
    this._owTabs = new foundry.applications.ux.Tabs({
      navSelector: ".ow-tabs",
      contentSelector: ".ow-tabs-content",
      group: "ow",
      initial: "read",
      callback: (_ev, tabs, active) => {
        // logs opcionales
         console.log(`[${MODULE_ID}] ow-tabs -> changed to`, active);
        this._owSyncProseMirrorOpen(rootEl, active);
      }
    });
    this._owTabs.bind(rootEl);

    // Forzar estado inicial coherente (muchos temas dejan el primer pane con display:block pegado)
    const initial = "read";
    this._owTabs.activate(initial);
    this._owSyncProseMirrorOpen(rootEl, initial);

    // --- Botón Guardar del toolbar ProseMirror (por si algún tema no lanza submit) ---
    rootEl.addEventListener("click", (ev) => {
      const t = ev.target.closest('[data-action="save"]');
      if (!t) return;
      ev.preventDefault();
      ev.stopPropagation();
      console.log(`[${MODULE_ID}] PM toolbar Save clicked`);
      this.submit({ preventClose: false });
    }, { capture: true });

    // Debug opcional
     console.log(`[${MODULE_ID}] ow-tabs anchors=`,
       rootEl.querySelectorAll(".ow-tabs a[data-action='tab'][data-tab]").length);
     console.log(`[${MODULE_ID}] ow-tabs panes=`,
       rootEl.querySelectorAll(".ow-tabs-content .tab[data-tab]").length);
  }

  async _updateObject(event, formData) {
    console.log(`[${MODULE_ID}] submit formData`, foundry.utils.duplicate(formData));
    const expanded = foundry.utils.expandObject(formData);
    console.log(`[${MODULE_ID}] submit expanded`, expanded);
    return super._updateObject(event, formData);
  }

  async close(options) {
    try { this._owTabs?.unbind?.(this.element[0] ?? this.element); } catch {}
    try { this._owTabs?.destroy?.(); } catch {}
    this._owTabs = null;
    return super.close(options);
  }
}
