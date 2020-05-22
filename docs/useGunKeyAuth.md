# useGunKeyAuth

A hook that logs an user in (using key pairs).
You pass it a Gun instance, some keys and a third argument that will tell the hook when you're ready to perform the auth.
The third parameter is `true` by default, so the hook will attempt to login immediately.

### Basic Usage:

```jsx harmony
import React from 'react';
import { useGun } from 'gundb-react-hooks';

export const App = () => {
  const [gun, sea] = useGun(Gun, ['http://this.is.a.peer/gun']);
  const [appKeys, setAppKeys] = useGunKeys(
    sea,
    () => JSON.parse(localStorage.getItem('existingKeysInLocalStorage')) || null
  );
  const [user, isLoggedIn] = useGunKeyAuth(gun, appKeys);

  return isLoggedIn ? <Main gun={gun} sea={sea} user={user} /> : <AuthView />;
};
```
