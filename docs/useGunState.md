# useGunState

A hook that gives you access to a Gun node.

### Basic Usage:

```jsx harmony
import React from 'react';
import { useGun } from '@altrx/gundb-react-hooks';
import SEA from 'gun/sea';

export const App = () => {
  const gun = useGun(Gun,  { peers: ['http://this.is.a.peer/gun'] });
  const appKeys = useGunKeys(SEA);
  const [user, isLoggedIn] = useGunKeyAuth(gun, appKeys);

  return isLoggedIn ? (
    <Main user={user} sea={SEA} appKeys={appKeys} />
  ) : (
    <AuthView />
  );
};

// MainView.js
const Main = ({ user, sea, appKeys }) => {
  // appKeys here act as an encryption/decryption key
  // if you don't want to use the same keys for encryption/decryption, you can pass a new set of keys or a random string/passphrase
  const { fields: profile, put } = useGunState(
    user.get('a').get('gun').get('node').get('profile'),
    { appKeys, sea },
  );
  const { name } = profile;

  // { name } here is a representation of the .get('profile') node.
  // it contains the latest value on every new render

  return <React.Fragment>
    <p>Hi, {name || 'visitor'}</p>
    <input
        className="edit"
        value={name}
        onChange={(e) => {
          put({ name: e.target.value });
        }}
      />
  <React.Fragment>;
};
```
