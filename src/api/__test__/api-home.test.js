import { testServer } from './utils';

describe('ttrack API', () => {
    describe('Home', async () => {
        it('should return the api version', async () => {
            const {data, status} = await testServer.get('/');
            expect(status).toEqual(200);
            expect(data).toEqual({
                "apiVersion": 1,
                "validVersions": [1],
                "version": "1.0.0"
            });
        });
    
    });
});