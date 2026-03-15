import React from 'react';
import { renderToString } from 'react-dom/server';

const html = renderToString(<style>{`body { color: red; }`}</style>);
console.log(html);
const xss = renderToString(<style>{`body { color: "blue</style><script>alert(1)</script>"; }`}</style>);
console.log(xss);
