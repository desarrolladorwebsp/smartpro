import assert from "node:assert/strict";
import test from "node:test";
import { defaultBoardDisplay, moveClientCardInOrder, orderClientCards, parseClientBoardPreferencePatch, resolveClientBoardPreferences } from "./board-preferences";

test("restaura las preferencias predeterminadas cuando la cuenta aún no tiene configuración", () => {
  assert.deepEqual(resolveClientBoardPreferences(null), { display: defaultBoardDisplay, collapsed: null, cardOrder: {} });
});


test("conserva las selecciones vacías y descarta identificadores inválidos o repetidos", () => {
  assert.deepEqual(parseClientBoardPreferencePatch({
    display: { view: "archived", status: "ACTIVO", executive: "exec", service: "Diseño", columns: [] },
    collapsed: ["business:a", "business:a", "invalido"],
    cardOrder: { NEW: ["person:b", "business:a"], INVALID: ["person:c"] },
  }), {
    display: { view: "archived", statuses: ["ACTIVO"], executives: ["exec"], services: ["Diseño"], columns: [] },
    collapsed: ["business:a"],
    cardOrder: { NEW: ["person:b", "business:a"] },
  });
});

test("guarda varias opciones por filtro y conserva Archivados en las columnas y el orden personal", () => {
  const result = resolveClientBoardPreferences({
    display: {
      statuses: ["ACTIVO", "POTENCIAL", "ACTIVO", "otro"],
      executives: ["e1", "e2", "e1", 3],
      services: ["Podcast", "Desarrollo web", "Podcast", ""],
      columns: ["NEW", "ARCHIVED", "ARCHIVED"],
    },
    cardOrder: { ARCHIVED: ["business:a"] },
  });
  assert.deepEqual(result.display, {
    view: "board", statuses: ["ACTIVO", "POTENCIAL"], executives: ["e1", "e2"], services: ["Podcast", "Desarrollo web"], columns: ["NEW", "ARCHIVED"],
  });
  assert.deepEqual(result.cardOrder, { ARCHIVED: ["business:a"] });
});

test("respeta el orden personal sin perder tarjetas nuevas ni depender de las que están filtradas", () => {
  const original = [
    { id: "business:a", name: "Alfa", crmPosition: 0 },
    { id: "person:b", name: "Beta" },
    { id: "business:c", name: "Gamma", crmPosition: 1 },
  ];
  const order = moveClientCardInOrder(["business:a", "person:b", "business:c"], "business:c", { key: "business:a", after: false });
  assert.deepEqual(order, ["business:c", "business:a", "person:b"]);
  assert.deepEqual(orderClientCards(original.filter(({ id }) => id !== "person:b"), order).map(({ id }) => id), ["business:c", "business:a"]);
  assert.deepEqual(orderClientCards([...original, { id: "person:d", name: "Delta" }], order).map(({ id }) => id), [...order, "person:d"]);
  assert.deepEqual(orderClientCards([...original]).map(({ id }) => id), ["business:a", "business:c", "person:b"]);
});
