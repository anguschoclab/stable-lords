const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const css = `body { color: "blue</style><script>alert(1)</script>"; }`;
const clean = DOMPurify.sanitize(css, { ALLOWED_TAGS: [] });
console.log(clean);
