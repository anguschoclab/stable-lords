import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const css = `
.dark [data-chart=123] > div {
  --color-foo: "</style><script>alert(1)</script>";
}
`;
console.log(renderToStaticMarkup(<style>{css}</style>));
console.log(renderToStaticMarkup(<style dangerouslySetInnerHTML={{ __html: css }} />));
