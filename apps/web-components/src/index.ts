import App from "./App.svelte";

window.onload = () => {
  const el = document.createElement("test-component");
  const shadow = el.attachShadow({ mode: "open" });
  document.body.appendChild(el);

  // TODO fix styles not applying correctly in shadow DOM (colors etc.)

  new App({ target: shadow });
};
