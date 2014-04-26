node-postgres-namedparams
=========================

Add named params support to node-postgres.

TODO: pg.native patching support

Usage:

```javascript
require('pg-namedparams').patch(pg);

var user = {
  username: 'bob',
  email: 'bob@bob.com'
};

client.query('INSERT INTO users (username) VALUES ($username, $email)', user, cb);
```
