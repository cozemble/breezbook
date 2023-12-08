import Test from "./components/Test.svelte";

window.onload = () => {
  // TODO shadow dom
  const el = document.createElement("test-component");
  document.body.appendChild(el);
  new Test({ target: el, props: { name: "world" } });
};
