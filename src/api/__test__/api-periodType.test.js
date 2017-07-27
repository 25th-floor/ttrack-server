import Glue from 'glue'; 
import path from 'path';
import manifest from '../../config/manifest';
import { PERIOD_TYPE_IDS } from '../../common/testUtils';

const relativeTo = path.join(__dirname, '../../');

describe('ttrack API',() => {
    let Server;
    beforeAll(async (done) => {
        Glue.compose(manifest, { relativeTo }, (err, server) => {
            if (err) {
                console.log('server.register err:', err);
            }
            server.start(() => {
                console.log('✅  Server is listening on ' + server.info.uri.toLowerCase());
                Server = server;
                done();
            });
        });
    });

    afterAll(async (done) => {
        console.log('STOP SERVER');
        await Server.stop();
        done();
    });

    describe('Period Types /api/period-types', async ()=>{

        describe('Test Method not implemented', () => {
            it(`Should fail method is not implemented POST on /api/period-types`, async ()=>{
                const response  = await Server.inject({ method: 'POST' , url: '/api/period-types' });
                expect(response.statusCode).toBe(405);
            });
            it(`Should fail method is not implemented PATCH on /api/period-types`, async ()=>{
                const response  = await Server.inject({ method: 'PATCH' , url: '/api/period-types' });
                expect(response.statusCode).toBe(405);
            });
            it(`Should fail method is not implemented PUT on /api/period-types`, async ()=>{
                const response  = await Server.inject({ method: 'PUT' , url: '/api/period-types' });
                expect(response.statusCode).toBe(405);
            });
            it(`Should fail method is not implemented DELETE on /api/period-types`, async ()=>{
                const response  = await Server.inject({ method: 'DELETE' , url: '/api/period-types' });
                expect(response.statusCode).toBe(405);
            });
        });

        describe("testing GET", async () => {
            it("should return 200 on success", async () => {
                const response  = await Server.inject({ method: 'GET', payload:{} , url: '/api/period-types' });
                expect(response.statusCode).toBe(200);
            });

            describe("success should return all ids", () => {
                const expectedIds = PERIOD_TYPE_IDS;

                for (let i in expectedIds) {
                    let id = expectedIds[i];
                    it(`and include period type id ${id}`, async () => {
                        const response  = await Server.inject({ method: 'GET', payload:{} , url: '/api/period-types' });
                        expect(response.statusCode).toBe(200);
                        const ids = response.result.map(t => t.pty_id);
                        expect(ids.indexOf(id)).not.toBe(-1);
                    });
                }
            });

            describe("success should return all names", () => {
                const expectedNames = [
                    'Arbeitszeit',
                    'Ausgleich',
                    'Feiertag',
                    'Kommentar',
                    'Krankenstand',
                    'Pflegeurlaub',
                    'Urlaub',
                ];

                for (let i in expectedNames) {
                    let name = expectedNames[i];
                    it(`and include period type id ${name}`, async () => {
                        const response  = await Server.inject({ method: 'GET', payload:{} , url: '/api/period-types' });
                        expect(response.statusCode).toBe(200);
                        const names = response.result.map(t => t.pty_name);
                        expect(names.indexOf(name)).not.toBe(-1);
                    });
                }
            });
        });
    });
});