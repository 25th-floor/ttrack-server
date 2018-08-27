import { testServer } from './utils';
const appRoot = require('app-root-path');
const {
    version, 
    ttrackServer: {
        apiVersion = 1,
        validVersions = [1],
    } 
} = require(`${appRoot}/package.json`);

describe('ttrack API', () => {
    describe('Home', async () => {
        it('should return the api version', async () => {
            const {data, status} = await testServer.get('/api/');
            expect(status).toEqual(200);
            expect(data).toMatchObject({
                "apiVersion": apiVersion,
                "validVersions": validVersions,
                "version": version
            });
        });
    
    });
});