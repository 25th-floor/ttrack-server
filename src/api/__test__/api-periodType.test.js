import { testServer } from './utils';
import JasmineExpect from 'jasmine-expect'; /* eslint-disable-line no-unused-vars */

import R from 'ramda';

describe('ttrack API',() => {
    describe('Period Types /api/period-types', async ()=>{

        /*
        describe('Test Method not implemented', () => {
            it(`Should fail method is not implemented POST on /api/period-types`, async ()=>{
                const {status} = await testServer.post('/api/period-types', {});
                expect(status).toEqual(405);
            });
            it(`Should fail method is not implemented PATCH on /api/period-types`, async ()=>{
                const {status} = await testServer.patch('/api/period-types', {});
                expect(status).toEqual(405);
            });
            it(`Should fail method is not implemented PUT on /api/period-types`, async ()=>{
                const {status} = await testServer.put('/api/period-types', {});
                expect(status).toEqual(405);
            });
            it(`Should fail method is not implemented DELETE on /api/period-types`, async ()=>{
                const {status} = await testServer.delete('/api/period-types');
                expect(status).toEqual(405);
            });
        });
        */

        describe("testing GET", async () => {
            it("should return 200 on success", async () => {
                const {status} = await testServer.get('/api/period-types');
                expect(status).toEqual(200);
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
                        const {data, status} = await testServer.get('/api/period-types');
                        expect(status).toBe(200);
                        const result = R.head(data.filter(t => t.pty_id === types[i].pty_id));
                        expect(result).toMatchObject(types[i]);
                    });
                }
            });
        });
    });
});