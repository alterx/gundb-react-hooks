# useGun

A hook for initalizing a GunDB instance.

### Basic Usage:

```jsx harmony
import React from 'react';
import { useGun } from 'gundb-react-hooks';

export const App = () => {
  const gun = useGun(Gun, { peers: ['http://this.is.a.peer/gun'] });
  return <Main gun={gun}></Main>;
};
```
