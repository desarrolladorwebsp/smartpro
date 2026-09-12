import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getPublicPortfolioCategory,
  isAllowedPortfolioAspect,
  PUBLIC_PORTFOLIO_FILTERS,
  slugifyPortfolioValue,
} from "./constants";
import { isManagedPortfolioImagePath } from "./image";
import { parsePortfolioProjectInput, parsePortfolioTags, parsePortfolioUrl } from "./validation";

describe("portfolio filters", () => {
  it("maps website aliases to Sitio Web", () => {
    assert.equal(getPublicPortfolioCategory("website"), "Sitio Web");
    assert.equal(getPublicPortfolioCategory("sitio-web"), "Sitio Web");
    assert.equal(getPublicPortfolioCategory("landing-page"), "Landing Page");
    assert.equal(getPublicPortfolioCategory("ecommerce"), "E-commerce");
    assert.equal(getPublicPortfolioCategory("sistemas"), null);
  });

  it("keeps the public filter list for Desarrollo Web", () => {
    assert.deepEqual([...PUBLIC_PORTFOLIO_FILTERS], ["Todos", "Sitio Web", "Landing Page", "E-commerce"]);
  });
});

describe("portfolio validation", () => {
  it("parses tags, url and payload", () => {
    assert.deepEqual(parsePortfolioTags("Landing Page, Next.js, Next.js"), ["Landing Page", "Next.js"]);
    assert.equal(parsePortfolioUrl("https://smartpro.cl"), "https://smartpro.cl");
    assert.throws(() => parsePortfolioUrl("ftp://x"), /https/);

    const parsed = parsePortfolioProjectInput({
      title: "  RealStock  ",
      subcategoryId: "sub-1",
      summary: "E-commerce",
      url: "https://www.realstock.cl",
      tags: "E-commerce, Catálogo",
      status: "PUBLISHED",
      sortOrder: "3",
    });

    assert.equal(parsed.title, "RealStock");
    assert.equal(parsed.status, "PUBLISHED");
    assert.equal(parsed.sortOrder, 3);
    assert.deepEqual(parsed.tags, ["E-commerce", "Catálogo"]);
  });

  it("requires title and subcategory", () => {
    assert.throws(() => parsePortfolioProjectInput({ title: "", subcategoryId: "x" }), /título/i);
    assert.throws(() => parsePortfolioProjectInput({ title: "Proyecto" }), /subcategoría/i);
  });
});

describe("portfolio images", () => {
  it("accepts 5:4 and rejects other ratios", () => {
    assert.equal(isAllowedPortfolioAspect(1280, 1024), true);
    assert.equal(isAllowedPortfolioAspect(1600, 1280), true);
    assert.equal(isAllowedPortfolioAspect(1600, 900), false);
    assert.equal(isAllowedPortfolioAspect(0, 4), false);
  });

  it("only treats managed upload paths as deletable", () => {
    assert.equal(isManagedPortfolioImagePath("/uploads/portfolio/abc.webp"), true);
    assert.equal(isManagedPortfolioImagePath("/images/portfolio/real-stock.png"), false);
  });

  it("slugifies titles", () => {
    assert.equal(slugifyPortfolioValue("Sitio Web Áxessia"), "sitio-web-axessia");
  });
});
