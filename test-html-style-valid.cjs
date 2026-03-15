const { JSDOM } = require("jsdom");

const dom = new JSDOM(`<!DOCTYPE html>
<html>
<body>
  <div class="test">Test</div>
  <style>
    .test {
      content: "hello";
      color: red;
    }
  </style>
</body>
</html>`);

const cssText = dom.window.document.styleSheets[0].cssRules[0].cssText;
console.log(cssText);
