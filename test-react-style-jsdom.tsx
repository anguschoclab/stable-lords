import { renderToString } from 'react-dom/server';
import React from 'react';

const css = `
.dark [data-chart=123] > div {
  --color-foo: "</style><script>alert(1)</script>";
}
`;

const res1 = renderToString(<style>{css}</style>);
console.log("With children:", res1);

const res2 = renderToString(<style dangerouslySetInnerHTML={{ __html: css }} />);
console.log("With dangerouslySetInnerHTML:", res2);
