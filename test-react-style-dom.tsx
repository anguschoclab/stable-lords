import { render } from '@testing-library/react';
import React from 'react';
import { JSDOM } from 'jsdom';

const css = `
.dark [data-chart=123] > div {
  --color-foo: "</style><script>alert(1)</script>";
}
`;

const { container } = render(<style>{css}</style>);
console.log("HTML:", container.innerHTML);
console.log("textContent:", container.firstChild.textContent);
