# useGunNamespace

A hook that creates a namespace for Gun.

### Basic Usage:

```jsx harmony
import React from 'react';
import { useGun } from '@altrx/gundb-react-hooks';

export const App = () => {
  const gun = useGun(Gun, { peers: ['http://this.is.a.peer/gun'] });
  const namespacedGraph = useGunNamespace(gun);
  const existingNamespacedGraph = useGunNamespace(gun, '~soul');
  return <Main gun={gun} user={existingNamespacedGraph} />;
};
```
