# useGunOnNodeUpdated

A hook that allows you to subscribe to any Gun node and receive updates.

### Basic Usage:

```jsx harmony
import React from 'react';
import { useGun } from '@altrx/gundb-react-hooks';
import SEA from 'gun/sea';

export const App = () => {
  const gun = useGun(Gun, { peers: ['http://this.is.a.peer/gun'] });
  const appKeys = useGunKeys(SEA);
  const [user, isLoggedIn] = useGunKeyAuth(gun, appKeys);

  useGunOnNodeUpdated(
    user,
    { appKeys },
    (udpate) => {
      // update was issued, do stuff
    },
    () => {
      // do some cleanup, optional
    }
  );

  return isLoggedIn ? (
    <Main user={user} sea={SEA} appKeys={appKeys} />
  ) : (
    <AuthView />
  );
};
```
