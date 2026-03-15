import React from 'react';
import { renderToString } from 'react-dom/server';

const css = `
.dark [data-chart="my-id"] {
  --color-foo: url("image.png");
  --color-bar: rgba(255, 0, 0, 0.5);
}
`;

console.log(renderToString(<style>{css}</style>));
