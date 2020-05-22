# useGunState

A hook that gives you access to a Gun node.

### Basic Usage:

```jsx harmony
import React from 'react';
import { useGun } from 'gundb-react-hooks';

export const App = () => {
  const [gun, sea] = useGun(Gun, ['http://this.is.a.peer/gun']);
  const [appKeys, setAppKeys] = useGunKeys(
    sea,
    () =>
      JSON.parse(localStorage.getItem('existingKeysInLocalStorage')) || null,
  );
  const [user, isLoggedIn] = useGunKeyAuth(gun, appKeys);

  return isLoggedIn ? (
    <Main sea={sea} user={user} appKeys={appKeys} />
  ) : (
    <AuthView />
  );
};

// MainView.js
const Main = ({ user, sea, appKeys }) => {
  // appKeys here act as an encryption/decryption key
  // if you don't want to use the same keys for encryption/decryption, you can pass a new set of keys or a random string/passphrase
  const [{ name }, { put }] = useGunState(
    user.get('a').get('gun').get('node').get('profile'),
    { appKeys, sea },
  );

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
