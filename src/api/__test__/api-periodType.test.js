import Glue from 'glue'; 
import path from 'path';
import R from 'ramda';

import manifest from '../../config/manifest';

const relativeTo = path.join(__dirname, '../../');

describe('ttrack API',() => {
    let Server;
    beforeAll(async (done) => {
        Glue.compose(manifest, { relativeTo }, (err, server) => {
            if (err) {
                console.log('server.register err:', err);
            }
            server.start(() => {
                server.log('✅  Server is listening on ' + server.info.uri.toLowerCase());
                Server = server;
                done();
            });
        });
    });

    afterAll(async (done) => {
        Server.log('STOP SERVER');
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

            describe("success should return all types", () => {
                const types = [
                    {
                        pty_id: "Work",
                        pty_name: "Arbeitszeit",
                    },
                    {
                        pty_id: "Vacation",
                        pty_name: "Urlaub",
                    },
                    {
                        pty_id: "Sick",
                        pty_name: "Krankenstand",
                    },
                    {
                        pty_id: "Nursing",
                        pty_name: "Pflegeurlaub",
                    },
                    {
                        pty_id: "Holiday",
                        pty_name: "Feiertag",
                    },
                    {
                        pty_id: "Comment",
                        pty_name: "Kommentar",
                    },
                    {
                        pty_id: "Balance",
                        pty_name: "Ausgleich",
                    },
                ];

                for (let i in types) {
                    let name = types[i].pty_name;
                    it(`and include period type ${name}`, async () => {
                        const response  = await Server.inject({ method: 'GET', payload:{} , url: '/api/period-types' });
                        expect(response.statusCode).toBe(200);
                        const result = R.head(response.result.filter(t => t.pty_id === types[i].pty_id));
                        expect(result).toMatchObject(types[i]);
                    });
                }
            });
        });
    });
});