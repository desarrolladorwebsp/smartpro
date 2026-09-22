import test from "node:test";
import assert from "node:assert/strict";

import { absoluteMediaUrl } from "./presenters";

function withAppUrl(value: string | undefined, run: () => void) {
  const previous = process.env.APP_URL;
  const previousPublic = process.env.NEXT_PUBLIC_APP_URL;

  if (value === undefined) {
    delete process.env.APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
  } else {
    process.env.APP_URL = value;
  }

  try {
    run();
  } finally {
    if (previous === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previous;

    if (previousPublic === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = previousPublic;
  }
}

test("convierte una ruta relativa en URL absoluta de SmartPro", () => {
  withAppUrl("https://smartpro.cl", () => {
    assert.equal(
      absoluteMediaUrl("/images/portfolio/tu-promesa.png"),
      "https://smartpro.cl/images/portfolio/tu-promesa.png",
    );
  });
});

test("tolera la barra final y las rutas sin barra inicial", () => {
  withAppUrl("https://smartpro.cl/", () => {
    assert.equal(absoluteMediaUrl("images/logo.png"), "https://smartpro.cl/images/logo.png");
  });
});

test("no toca las URLs que ya son absolutas", () => {
  withAppUrl("https://smartpro.cl", () => {
    assert.equal(absoluteMediaUrl("https://cdn.otro.cl/a.png"), "https://cdn.otro.cl/a.png");
    assert.equal(absoluteMediaUrl("data:image/png;base64,AAA"), "data:image/png;base64,AAA");
  });
});

test("una imagen vacía sigue vacía", () => {
  withAppUrl("https://smartpro.cl", () => {
    assert.equal(absoluteMediaUrl(""), "");
    assert.equal(absoluteMediaUrl("   "), "");
  });
});

test("sin APP_URL devuelve la ruta tal cual en lugar de fallar", () => {
  withAppUrl(undefined, () => {
    assert.equal(absoluteMediaUrl("/images/a.png"), "/images/a.png");
  });
});
