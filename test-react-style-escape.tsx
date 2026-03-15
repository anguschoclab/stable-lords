import React from 'react';
import { renderToString } from 'react-dom/server';

const css = `
.dark [data-chart=123] > div {
  --color-foo: "</style><script>alert(1)</script>";
}
`;

console.log(renderToString(<style>{css}</style>));
console.log(renderToString(<style dangerouslySetInnerHTML={{ __html: css }} />));
