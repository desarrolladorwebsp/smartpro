import test from "node:test";
import assert from "node:assert/strict";

import { classifyWebpayReturn, parseWebpayReturnParams } from "./return-params";

test("flujo normal llega solo con token_ws y debe confirmarse", () => {
  const classified = classifyWebpayReturn(parseWebpayReturnParams({ token_ws: "tok-ok" }));
  assert.equal(classified.kind, "commit");
  assert.equal(classified.token, "tok-ok");
});

test("pago abortado llega con TBK_TOKEN y no debe confirmarse", () => {
  const classified = classifyWebpayReturn(
    parseWebpayReturnParams({
      TBK_TOKEN: "tok-abort",
      TBK_ORDEN_COMPRA: "SP-2026-100001",
      TBK_ID_SESION: "SP-2026-100001-session",
    }),
  );
  assert.equal(classified.kind, "aborted");
  assert.equal(classified.token, "tok-abort");
  assert.equal(classified.buyOrder, "SP-2026-100001");
});

test("timeout llega sin token y con orden/sesión", () => {
  const classified = classifyWebpayReturn(
    parseWebpayReturnParams({
      TBK_ORDEN_COMPRA: "SP-2026-100002",
      TBK_ID_SESION: "SP-2026-100002-session",
    }),
  );
  assert.equal(classified.kind, "timeout");
  assert.equal(classified.token, "");
  assert.equal(classified.buyOrder, "SP-2026-100002");
});

test("error de recuperación llega con token_ws y TBK_TOKEN", () => {
  const classified = classifyWebpayReturn(
    parseWebpayReturnParams({
      token_ws: "tok-ws",
      TBK_TOKEN: "tok-tbk",
      TBK_ORDEN_COMPRA: "SP-2026-100003",
    }),
  );
  assert.equal(classified.kind, "error");
});
