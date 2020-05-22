# useGunKeys

A hook that creates or retrieves a set of keys that you can use with SEA/Gun.
The second parameter (initial value) is passed as is to the underlying `useState` hook.

### Basic Usage:

```jsx harmony
import React from 'react';
import { useGun } from 'gundb-react-hooks';

export const App = () => {
  const [gun, sea] = useGun(Gun, ['http://this.is.a.peer/gun']);
  const [namespacedGraph] = useGunNamespace(gun);
  const [appKeys, setAppKeys] = useGunKeys(
    sea,
    () => JSON.parse(localStorage.getItem('todoKeys')) || null
  );
  return <Main gun={gun} sea={sea} user={namespacedGraph} />;
};
```
