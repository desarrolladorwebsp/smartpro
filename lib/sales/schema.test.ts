import assert from "node:assert/strict";
import test from "node:test";

import { isMissingSalePaymentTableError } from "./schema";

test("detecta tabla SalePayment ausente", () => {
  assert.equal(
    isMissingSalePaymentTableError({ code: "P2021", message: "The table `SalePayment` does not exist in the current database." }),
    true,
  );
  assert.equal(isMissingSalePaymentTableError(new Error("Table 'smartpro.SalePayment' doesn't exist")), true);
  assert.equal(isMissingSalePaymentTableError(new Error("No hay conexión a la base de datos.")), false);
});
