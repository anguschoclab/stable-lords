import React from 'react';
import { renderToString } from 'react-dom/server';

const css = `
.dark [data-chart=123] > div {
  --color-foo: red;
}
`;

console.log(renderToString(<style>{css}</style>));
