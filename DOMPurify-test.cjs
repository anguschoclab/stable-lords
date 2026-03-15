const createDOMPurify = require('dompurify');
const { JSDOM } = require('jsdom');

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

const dirty = '<style>body { color: "blue</style><script>alert(1)</script>"; }</style>';
const clean = DOMPurify.sanitize(dirty);
console.log(clean);
