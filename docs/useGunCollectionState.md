# useGunStateCollection

A hook that gives you access to a Gun Set. Similar to how `useGunState` works but for a collection of items stored under the same node.

### Basic Usage:

```jsx harmony
import React from 'react';
import { useGun } from 'gundb-react-hooks';
import SEA from 'gun/sea';

export const App = () => {
  const gun = useGun(Gun,  { peers: ['http://this.is.a.peer/gun'] });
  const appKeys = useGunKeys(SEA);
  const [user, isLoggedIn] = useGunKeyAuth(gun, appKeys);

  return isLoggedIn ? (
    <Main sea={SEA} user={user} appKeys={appKeys} />
  ) : (
    <AuthView />
  );
};

// MainView.js
const Main = ({ user, sea, appKeys }) => {
  // - AppKeys here act as an encryption/decryption key
  // if you don't want to use the same keys for encryption/decryption, you can pass a new set of keys or a random string/passphrase
  // - This node was created using .set()
  const { collection: todos, addToSet, updateInSet } = useGunCollectionState(
    user.get('a').get('gun').get('node').get('todos'),
    { appKeys, SEA },
  );

  // - `todos` here is a representation of the .get('todos') Set. It contains the latest values on every new render.
  // - The collection is returned as an object

  let todoList = Object.keys(todos).map((k) => todos[k]);

  return <React.Fragment>
    <ul>
        {
            todoList.map(todo => <li key={todo.id}>{todo.text}</li>)
        }
    </ul>
  <React.Fragment>;
};
```
