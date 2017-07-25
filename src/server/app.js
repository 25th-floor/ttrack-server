/* eslint-disable import/no-dynamic-require*/
import express from 'express';
import pg from 'pg';
import raven from 'raven';
import cors from 'cors';

import resources from './resources';

const app = express();
app.use(cors());

const dbconfigfile = require(`${__dirname}/../../database.json`);
const dbconfig = dbconfigfile.dev;

console.info('nodeENV', process.env.NODE_ENV);

let buildInfo = {};
try {
    const fileName = `${__dirname}/../../buildinfo.json`;
    if (require.resolve(fileName)) {
        // eslint-disable-next-line global-require
        buildInfo = require(fileName);
    }
// eslint-disable-next-line no-empty
} catch (e) {}

// raven configuration
let sentryClient;
if (process.env.SENTRY_TOKEN) {
    sentryClient = new raven.Client(process.env.SENTRY_TOKEN, {
        release: buildInfo.git || '',
        environment: process.env.NODE_ENV,
    });
}

console.info('Sentry', sentryClient ? 'enabled' : 'disabled');

app.set('sentry_client', sentryClient);

app.set('pg', (fn) => {
    pg.connect(dbconfig, (err, client, done) => {
        if (err) {
            return console.error('failed to retrieve client from pool');
        }
        fn(client);
        done();
        return true;
    });
});

app.use('/api', resources.api);

app.all(/.*/, (req, res) => {
    res.status(404).send('Not Found').end();
});

const port = process.env.PORT || 8080;
app.listen(port);

console.info(`listening on port ${port}...`);

process.on('SIGINT', () => {
    process.exit();
});
