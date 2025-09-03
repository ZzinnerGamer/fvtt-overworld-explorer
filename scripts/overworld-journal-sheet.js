// scripts/overworld-journal-sheet.js
const MODULE_ID = "overworld-explorer";
console.log(`[${MODULE_ID}] loaded overworld-journal-sheet.js`);

export class OverworldJournalEntrySheet extends foundry.applications.sheets.journal.JournalEntrySheet {
  static get defaultOptions() {
    const opts = super.defaultOptions;
    opts.classes = [...(opts.classes ?? []), MODULE_ID, "journal-entry"];
    opts.width   = opts.width  ?? 900;
    opts.height  = opts.height ?? 750;
    return opts;
  }

  get template() {
    return `modules/${MODULE_ID}/templates/journal-overworld.hbs`;
  }

  _getHeaderButtons() {
    const btns = super._getHeaderButtons()
      .filter(b => !["addPage","addImage","addPDF","addAudio","addVideo"].includes(b.class));
    btns.unshift({
      label: "Añadir evento",
      class: "ow-add-event",
      icon: "fa-solid fa-map-location-dot",
      onclick: () => this._createEventPage()
    });
    return btns;
  }

  async _createEventPage() {
    const entry = this.object;
    const page  = await JournalEntryPage.create({
      parent: entry,
      name: "Nuevo evento",
      type: "text",
      // OJO: esta cadena debe poder resolverse (ver #3 abajo)
      sheetClass: `${MODULE_ID}.OverworldEventPageSheet`,
      flags: { [MODULE_ID]: {
        text: { overview: "", exposition: "", summary: "" },
        creatures: [], sceneUuid: "", enemyRegionId: "", allyRegionId: "",
        rarity: "common", completed: false
      }}
    });
    page.sheet?.render(true);
  }
}
