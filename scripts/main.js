// scripts/main.js
import { OverworldEventPageSheet } from "./overworld-event-page.js";
import { OverworldJournalEntrySheet } from "./overworld-journal-sheet.js";

const MODULE_ID = "overworld-explorer";

Hooks.once("init", async () => {
  console.log(`[${MODULE_ID}] init:start`);

  await foundry.applications.handlebars.loadTemplates([
    `modules/${MODULE_ID}/templates/event-page-edit.hbs`,
    `modules/${MODULE_ID}/templates/event-page-view.hbs`,
    `modules/${MODULE_ID}/templates/journal-overworld.hbs`
  ]);
  console.log(`[${MODULE_ID}] templates loaded`);

  const DSC = foundry.applications.apps.DocumentSheetConfig;

  // Página (JournalEntryPage)
  DSC.registerSheet(JournalEntryPage, MODULE_ID, OverworldEventPageSheet, {
    types: ["text"],
    makeDefault: false,
    label: "Overworld Explorer: Event Page"
  });
  console.log(`[${MODULE_ID}] registered OverworldEventPageSheet for JournalEntryPage(type=text)`);

  // Journal contenedor (JournalEntry)
  DSC.registerSheet(JournalEntry, MODULE_ID, OverworldJournalEntrySheet, {
    makeDefault: false,
    label: "Overworld Explorer: Journal"
  });
  console.log(`[${MODULE_ID}] registered OverworldJournalEntrySheet for JournalEntry`);

  // Exporta por si haces sheetClass por string
  const ns = globalThis[MODULE_ID] ?? (globalThis[MODULE_ID] = {});
  ns.OverworldEventPageSheet = OverworldEventPageSheet;
  ns.OverworldJournalEntrySheet = OverworldJournalEntrySheet;

  console.log(`[${MODULE_ID}] init:done`);
});

Hooks.on("renderJournalEntrySheet", (app, html) => {
  const $html = html instanceof jQuery ? html : $(html);
  const ours = app?.constructor?.name === "OverworldJournalEntrySheet";
  console.log(`[${MODULE_ID}] [renderJournalEntrySheet] ours=${ours} app=${app?.constructor?.name}`);
  if (!ours) return;

  // Cambiar botón "Add Page"
  const $btn = $html.find('.journal-sidebar .action-buttons .create[data-action="createPage"]');
  if (!$btn.length) return;
  $btn.find("span").text("Añadir evento");
  $btn.find("i").attr("class", "fa-solid fa-map-location-dot");
  $btn.off("click").on("click", async () => app._createEventPage());
});

// main.js
Hooks.on("renderJournalEntryPageProseMirrorSheet", (pageSheet, html) => {
  const isOurs = pageSheet?.document?.parent?.sheet instanceof OverworldJournalEntrySheet;
  console.log(`[${MODULE_ID}] [renderJEPMS] page=${pageSheet?.document?.name} ours=${isOurs}`);
  if (isOurs) pageSheet.element?.classList?.add(MODULE_ID);

  // (opcional: si quieres inspeccionar el part content sin romper nada)
  try {
    const $html = (html instanceof jQuery) ? html : window.jQuery(html);
    const $content = $html.find('[data-application-part="content"]');
    console.log(`[${MODULE_ID}] [renderJEPMS] content exists=${!!$content.length}`);
  } catch (e) {
    console.warn(`[${MODULE_ID}] jQuery check failed`, e);
  }
});


