# useGunKeys

A hook that creates or retrieves a set of keys that you can use with SEA/Gun.
The second parameter (initial value) is passed as is to the underlying `useState` hook.

### Basic Usage:

```jsx harmony
import React from 'react';
import { useGun } from 'gundb-react-hooks';

export const App = () => {
  const gun = useGun(Gun, { peers: ['http://this.is.a.peer/gun'] });
  const namespacedGraph = useGunNamespace(gun);
  return <Main gun={gun} user={namespacedGraph} />;
};
```
