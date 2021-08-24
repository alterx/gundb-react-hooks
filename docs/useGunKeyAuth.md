# useGunKeyAuth

A hook that logs an user in (using key pairs).
You pass it a Gun instance, some keys and a third argument that will tell the hook when you're ready to perform the auth.
The third parameter is `true` by default, so the hook will attempt to login immediately.

### Basic Usage:

```jsx harmony
import React from 'react';
import { useGun } from 'gundb-react-hooks';
import SEA from 'gun/sea';

export const App = () => {
  const gun = useGun(Gun, { peers: ['http://this.is.a.peer/gun'] });
  const appKeys = useGunKeys(SEA);
  const [user, isLoggedIn] = useGunKeyAuth(gun, appKeys);

  return isLoggedIn ? <Main gun={gun} sea={sea} user={user} /> : <AuthView />;
};
```
