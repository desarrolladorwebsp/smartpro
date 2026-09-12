import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { isMissingPortfolioTableError, isPortfolioConnectionError } from "./schema";

describe("portfolio schema errors", () => {
  it("detects a missing PortfolioProject table without treating it as a connection failure", () => {
    const missing = Object.assign(new Error("The table `PortfolioProject` does not exist in the current database."), {
      code: "P2021",
    });

    assert.equal(isMissingPortfolioTableError(missing), true);
    assert.equal(isPortfolioConnectionError(missing), false);
  });

  it("detects a real database connection error", () => {
    const connection = new Error("No hay conexión a la base de datos.");

    assert.equal(isPortfolioConnectionError(connection), true);
    assert.equal(isMissingPortfolioTableError(connection), false);
  });

  it("does not treat empty-table success as an error", () => {
    assert.equal(isMissingPortfolioTableError(null), false);
    assert.equal(isMissingPortfolioTableError({ code: "P2025" }), false);
  });
});
