# useGunNamespace

A hook that creates a namespace for Gun.

### Basic Usage:

```jsx harmony
import React from 'react';
import { useGun } from 'gundb-react-hooks';

export const App = () => {
  const [gun, sea] = useGun(Gun, ['http://this.is.a.peer/gun']);
  const [namespacedGraph] = useGunNamespace(gun);
  return <Main gun={gun} sea={sea} user={namespacedGraph} />;
};
```
