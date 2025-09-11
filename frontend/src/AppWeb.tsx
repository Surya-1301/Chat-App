import React from 'react';
// Try to reuse existing Root component if present
let Root: React.ComponentType = () => <div>App root not found — check ./Root import</div>;

try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mod: any = require('./Root');
  Root = mod?.default ?? mod;
} catch (err) {
  // no-op
}

export default function App() {
  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Root />
    </div>
  );
}
