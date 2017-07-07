# TTrack Server

[![Build Status](https://travis-ci.org/25th-floor/ttrack.svg?branch=master)](https://travis-ci.org/25th-floor/ttrack)

A Time Tracking application server. Needs a Postgres Database and a client.

## Getting Stated

### Dependencies
First you need a postgres Database with at least version 9.3.

For manual installation you also need npm and the npm package db-migrate:
```
$ npm install -g db-migrate
```

### Manual Install
Then you need the database config file from config:
```
cp database.json.example database.json
```

Adjust the config to your setup and then you need to install the database migrations using:
```
db-migrate up
```

To start the server you need the node environment `NODE_ENV` setup to `production`.
Then call npm to start the server:
```
npm start
```

### Docker Variant
#### Production
TBC3

#### Development
There is a `docker-compose.yml` which provides the basic means to start the node server in development mode. It also starts a postgres database docker image and links it. 

The node server will expose port `8080` and postgres will expose `5432` for development purposes.

You still need to start the frontend code using npm:
```
$ npm run dev
```
And you are good to go to develop in the frontend.
 
Please understand that this setup is good for working on the client (frontend) code. If you need to work on the node server this will not work as the docker image does not update code changes.

To work on the server it's not recommended to use docker but the direct approach @see Development > Getting Started.  

#### Testing

To test the common code just call `npm run test`. For the api tests you need to start the docker test setup:
```
$ docker-compose -f docker-compose.test.yml up
``` 

Be sure everything is running. Unfortunately at the first run the database needs more time therefore the node server will stop working.
You need to start everything a second time to get the setup running.

Then you can start the tests calling locally:
```
$ npm run test-server
```

## Administration

To setup the users you need to be comfortable using the psql shell and working with the database as there is no Administration Interface, everything is done using pure sql.
The `user` table is your main starting point.

Also the austrian holdiays are kind of hardcoded.

## Development

This section explains how to develop the TTrack application.

### Getting Started

To start developing you have to run the app in dev mode.
Prefer to do this locally which will be more efficient.

```
# don't forget migrations!
$ db-migrate up

# start the ttrack server (port 8080)
$ npm start

# start the webpack dev server
$ npm run dev

# open the app
$ open http://localhost:8080
```

The webpack dev server watches the sources and serves the built JS and CSS with hot reloading enabled.
The ttrack server serves the main index.html and the rest API. It requests JS and CSS from the webpack dev server.

### Contributors

Since because of security concerns we needed to purge the git commit history, here are the contributors of the project.

* Marcus Artner <ma@25th-floor.com>
* Andreas de Pretis <ad@25th-floor.com>
* Stefan Oestreicher <so@25th-floor.com>
* Martin Prebio <martin.prebio@gmail.com>
* Robert Prosenc <rp@25th-floor.com>
* Ali Sharif <as@25th-floor.com>
* Pierre Strohmeier <ps@25th-floor.com>
* Thomas Subera <thomas.subera@gmail.com>

### History

It all started as a fun project and never majored of it. It is strictly a tool for tracking our times with our needs. (f.e. Austrian Holidays, no Administration, ...)
