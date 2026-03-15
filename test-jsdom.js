const { JSDOM } = require("jsdom");

const dom = new JSDOM(`<!DOCTYPE html>
<html>
<body>
  <style>body { color: &quot;red&quot;; content: "&gt;"; }</style>
  <style id="s2"></style>
</body>
</html>`);

const s1 = dom.window.document.querySelector("style").textContent;
console.log("s1 textContent:", s1);
console.log("s1 sheet cssRules:", dom.window.document.styleSheets[0].cssRules.length);

const s2 = dom.window.document.getElementById("s2");
s2.textContent = `body { color: "red"; content: ">"; }`;
console.log("s2 textContent:", s2.textContent);
