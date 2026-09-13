export function redirectToWebpay(url: string, token: string) {
  if (typeof document === "undefined") {
    throw new Error("Webpay solo puede redirigirse desde el navegador.");
  }

  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;
  form.acceptCharset = "UTF-8";

  const input = document.createElement("input");
  input.type = "hidden";
  input.name = "token_ws";
  input.value = token;
  form.appendChild(input);

  document.body.appendChild(form);
  form.submit();
}
