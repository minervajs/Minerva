# MinervaJS

[MinervaJS](http://minervajs.org) is a tool for publishing and finding Javascript Libraries, and weaving them together.

## Starting up a local version.

### Prerequisites

To run Minerva locally you need [NodeJS](http://nodejs.org/), [CouchDB](http://couchdb.apache.org/), [Redis](http://redis.io/), and the [Heroku Toolbelt](https://toolbelt.heroku.com/). If you're on a Mac and have [Homebrew](http://mxcl.github.com/homebrew/), try:

```
brew install node couchdb redis heroku-toolbelt
```

You will also need [node.couchapp.js](https://github.com/mikeal/node.couchapp.js/tree/), so ``npm install -g couchapp``

You will also need a [Google Oauth 2 API](https://developers.google.com/accounts/docs/OAuth2) key.

### MinervaJS

* ``git clone git://github.com/minervajs/Minerva.git``
* ``cd Minerva``
* Create a ``.env`` with the following credentials:

```
CLIENT_ID=[google client id]
CLIENT_SECRET=[google client secret]
COOKIE_SECRET=[secret used for cookies]
CLOUDANT_URL=[couchdb url (with credentials)]
```

* ``npm start``. This first time will create the database.
* CTRL-C to close the server.
* ``couchapp push couchapp.js [couchdb url (with credentials)]/minerva``
* ``npm start``
* ``open http://localhost:5000``