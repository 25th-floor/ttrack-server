import { testServer, createDatabaseConnection } from './utils';

import R from 'ramda';
import { PERIOD_TYPE_IDS, createPeriodStubWithDayForUserAndDate } from '../../utils/testUtils';

const createUserSql = 'SELECT * FROM create_user( $1, $2, $3, $4, $5)';

const apiCreatePath = (user) => `/api/users/${user}/periods/`;
const apiPutAndDeletePath = (user,per_id) => `/api/users/${user}/periods/${per_id}`;

describe('ttrack API',() => {
    describe('Periods /api/users/{id}/periods', async ()=>{
        let user;
        let client;
        beforeAll(async (done) => {
            client = await createDatabaseConnection();
            user = await client.query(createUserSql,['Mister', 'Smith', 'mister@smith.com','2001-01-01', '38:30:00']);
            user = R.head(user.rows);
            done();
        });

        afterAll(async (done) => {
            await client.query(`DELETE FROM days WHERE day_usr_id = ${user.usr_id}`);
            await client.query(`DELETE FROM user_target_times WHERE utt_usr_id = ${user.usr_id}`);
            await client.query(`DELETE FROM users WHERE usr_id = ${user.usr_id}`);
            done();
        });
        /*
        describe('Test Method not implemented', () => {
            it(`Should fail method is not implemented GET on ${apiCreatePath('{user.usr_id}')}`, async ()=>{
                const response  = await Server.inject({ method: 'GET' , url: apiCreatePath(user.usr_id) });
                expect(response.statusCode).toBe(405);
            });
            it(`Should fail method is not implemented PATCH on ${apiCreatePath('{user.usr_id}')}`, async ()=>{
                const response  = await Server.inject({ method: 'PATCH' , url: apiCreatePath(user.usr_id) });
                expect(response.statusCode).toBe(405);
            });
            it(`Should fail method is not implemented PUT on ${apiCreatePath('{user.usr_id}')}`, async ()=>{
                const response  = await Server.inject({ method: 'PUT' , url: apiCreatePath(user.usr_id) });
                expect(response.statusCode).toBe(405);
            });
            it(`Should fail method is not implemented DELETE on ${apiCreatePath('{user.usr_id}')}`, async ()=>{
                const response  = await Server.inject({ method: 'DELETE' , url: apiCreatePath(user.usr_id) });
                expect(response.statusCode).toBe(405);
            });
        });
        */

        describe("testing create(POST)", async () => {
            it("should fail with missing date", async () => {
                let error;
                await testServer.post(apiCreatePath(user.usr_id), {})
                    .catch(e => error = e);
                expect(error.response.status).toBe(400);
                expect(error.response.data.message).toBe('child "date" fails because ["date" is required]');
            });

            it("should fail with missing Period Type", async () => {
                let error;
                await testServer.post(apiCreatePath(user.usr_id), {"date": "2001-01-01" })
                    .catch(e => error = e);
                expect(error.response.status).toBe(400);
                expect(error.response.data.message).toBe('child "per_pty_id" fails because ["per_pty_id" is required]');
            });
            
            it("should fail with missing per_start‌⁠", async () => {
                let error;
                await testServer.post(
                    apiCreatePath(user.usr_id),
                    {
                        "date": "2001-01-01",
                        "per_pty_id": "Work" 
                    }
                )
                    .catch(e => error = e);
                expect(error.response.status).toBe(400);
                expect(error.response.data.message).toBe('child "per_start" fails because ["per_start" is required]');
            });

            it("should succeed on success", async () => {
                const {data, status} = await testServer.post(
                    apiCreatePath(user.usr_id),
                    {
                        "date": "2001-01-01",
                        "per_pty_id": "Work",
                        "per_start": "PT8H",
                    }
                );

                expect(status).toBe(201);
                expect(data).toMatchObject({
                    "per_break": null,
                    "per_comment": null,
                    "per_pty_id": "Work",
                    "per_duration": {},
                    "per_start": {
                        "hours": 8,
                        "minutes": 0
                    },
                    "per_stop": null
                });
            });

            it("should set duration correctly", async () => {
                const {data, status} = await testServer.post(
                    apiCreatePath(user.usr_id),
                    {
                        "per_pty_id": "Work",
                        "per_comment": null,
                        "per_start": "PT8H",
                        "per_stop": "PT10H",
                        "date": "2001-01-02",
                    }
                );

                expect(status).toBe(201);
                expect(data).toMatchObject({
                    "per_break": null,
                    "per_comment": null,
                    "per_pty_id": "Work",
                    "per_duration": {},
                    "per_start": {
                        "hours": 8,
                        "minutes": 0
                    },
                    "per_stop": {
                        "hours": 10,
                        "minutes": 0
                    }
                });
            });

            it("should set break correctly", async () => {
                const {data, status} = await testServer.post(
                    apiCreatePath(user.usr_id),
                    {
                        "per_pty_id": "Work",
                        "per_start": "PT8H",
                        "per_stop": "PT10H",
                        "per_break": "PT30M",
                        "date": "2001-01-02",
                    }
                );

                expect(status).toBe(201);
                expect(data).toMatchObject({
                    "per_break": {
                        "minutes": 30
                    },
                    "per_comment": null,
                    "per_pty_id": "Work",
                    "per_duration": {},
                    "per_start": {
                        "hours": 8,
                        "minutes": 0
                    },
                    "per_stop": {
                        "hours": 10,
                        "minutes": 0
                    }
                });
            });

            it("should set comments", async () => {
                const {data, status} = await testServer.post(
                    apiCreatePath(user.usr_id),
                    {
                        "per_pty_id": "Work",
                        "per_start": "PT8H",
                        "per_stop": "PT10H",
                        "per_break": "PT30M",
                        "per_comment": "example",
                        "date": "2001-01-02",
                    }
                );
                expect(status).toBe(201);
                expect(data).toMatchObject({
                    "per_break": {
                        "minutes": 30
                    },
                    "per_comment": "example",
                    "per_pty_id": "Work",
                    "per_duration": {},
                    "per_start": {
                        "hours": 8,
                        "minutes": 0
                    },
                    "per_stop": {
                        "hours": 10,
                        "minutes": 0
                    }
                });
            });

            it("should work with fullday duration", async () => {
                const {data, status} = await testServer.post(
                    apiCreatePath(user.usr_id),
                    {
                        "date": "2001-01-01",
                        "per_pty_id": "Sick",
                        "per_duration": "PT7H42M",
                        "per_start": null,
                        "per_stop": null,
                    }
                );

                expect(status).toBe(201);
                expect(data).toMatchObject({
                    "per_pty_id": "Sick",
                    "per_start": null,
                    "per_stop": null,
                    "per_break": null,
                    "per_comment": null,
                    "per_duration": { "hours" : 7, "minutes": 42 },
                });
            });
        });

        describe("testing available PeriodTypes", () => {
            PERIOD_TYPE_IDS.forEach((type, index) => {
                it(`should work with periodType '${type}'`,async () => {
                    const payload = {
                        "per_pty_id": type,
                        "per_start": "PT8H",
                        "date": `2001-02-${index + 1}`,
                    };

                    const {data, status} = await testServer.post(apiCreatePath(user.usr_id), payload );
    
                    expect(status).toBe(201);
                    expect(data).toMatchObject({
                        per_pty_id: type,
                        per_start: {
                            hours: 8,
                            minutes: 0,
                        },
                        per_stop: null,
                        per_break: null,
                        per_comment: null,
                        per_duration: {},
                    });
                }); 
            });
        });

        describe("testing udpate(PUT)", () => {
            let period;
            const date = '2001-03-01';

            beforeAll(async (done) => {
                period = await createPeriodStubWithDayForUserAndDate(client, user.usr_id, date);
                done();
            });

            afterAll(async (done) => {
                await client.query(`DELETE FROM days WHERE day_id = ${period.per_day_id}`);
                done();
            });
            /*
            describe('Test Method not implemented', () => {
                it(`Should fail method is not implemented GET on ${apiCreatePath('{user.usr_id}')}`, async ()=>{
                    const response  = await Server.inject({ method: 'GET' , url: apiPutAndDeletePath(user.usr_id, period.per_id) });
                    expect(response.statusCode).toBe(405);
                });
                it(`Should fail method is not implemented PATCH on ${apiCreatePath('{user.usr_id}')}`, async ()=>{
                    const response  = await Server.inject({ method: 'PATCH' , url: apiPutAndDeletePath(user.usr_id, period.per_id) });
                    expect(response.statusCode).toBe(405);
                });
                it(`Should fail method is not implemented POST on ${apiCreatePath('{user.usr_id}')}`, async ()=>{
                    const response  = await Server.inject({ method: 'POST' , url: apiPutAndDeletePath(user.usr_id, period.per_id) });
                    expect(response.statusCode).toBe(405);
                });
            });
            */
            it(`should return 404 Status code on PUT with userID of 0`, async ()=>{
                let status;
                await testServer.put(
                    apiPutAndDeletePath(0, period.per_id),
                    {
                        date,
                        "per_pty_id": 'Work',
                        "per_start": "PT8H",
                    }
                )
                    .catch(error => status = error.response.status);
                expect(status).toBe(404);
            });

            it(`should return 404 Status code on PUT with period.per_id of 0`, async ()=>{
                let status;
                await testServer.put(
                    apiPutAndDeletePath(user.usr_id, 0),
                    {
                        date,
                        "per_pty_id": 'Work',
                        "per_start": "PT8H",
                    }
                )
                    .catch(error => status = error.response.status);
                expect(status).toBe(404);
            });

            it(`should return 404 Status code on DELETE with user.usr_id of 0`, async ()=>{
                let status;
                await testServer.delete(apiPutAndDeletePath(0, user.usr_id))
                    .catch(error => status = error.response.status);
                expect(status).toBe(404);
            });

            it("should fail if payload is empty", async () => {
                let error;
                await testServer.put(apiPutAndDeletePath(user.usr_id, period.per_id), {})
                    .catch(e => error = e);
                expect(error.response.status).toBe(400);
                expect(error.response.data.message).toBe('child "date" fails because ["date" is required]');
            });

            it("should fail if missing the period type", async () => {
                let error;
                await testServer.put(
                    apiPutAndDeletePath(user.usr_id, period.per_id),
                    { date }
                )
                    .catch(e => error = e);
                expect(error.response.status).toBe(400);
                expect(error.response.data.message).toBe('child "per_pty_id" fails because ["per_pty_id" is required]');
            });

            it("should fail if missing start", async () => {
                let error;
                await testServer.put(
                    apiPutAndDeletePath(user.usr_id, period.per_id),
                    {
                        date,
                        per_pty_id: 'Work',
                    }
                )
                    .catch(e => error = e);
                expect(error.response.status).toBe(400);
                expect(error.response.data.message).toBe('child "per_start" fails because ["per_start" is required]');
            });

            it("should work on success", async () => {
                const {data, status} = await testServer.put(
                    apiPutAndDeletePath(user.usr_id, period.per_id),
                    {
                        date,
                        per_pty_id: 'Work',
                        "per_start": "PT8H",
                    }
                );
                expect(status).toBe(200);
                expect(data).toMatchObject({
                    "per_break": null,
                    "per_comment": null,
                    "per_pty_id": "Work",
                    "per_duration": {},
                    "per_start": {
                        "hours": 8,
                        "minutes": 0
                    },
                    "per_stop": null
                });
            });

            // per_day_id is not allowd ??
            it("day id should not be changed", async () => {
                const payload = {
                    date,
                    per_pty_id: 'Work',
                    per_start: "PT8H",
                    per_day_id: period.per_day_id + 1,
                };
                const {data, status} = await testServer.put(apiPutAndDeletePath(user.usr_id, period.per_id), payload);
                expect(status).toBe(200);
                expect(data).toMatchObject({
                    "per_break": null,
                    "per_comment": null,
                    "per_day_id": period.per_day_id,
                    "per_pty_id": "Work",
                    "per_duration": {},
                    "per_start": {
                        "hours": 8,
                        "minutes": 0
                    },
                    "per_stop": null
                });
            });

            it("should fail if period id is wrong", async () => {
                const payload = {
                    date,
                    per_pty_id: 'Work',
                    per_start: "PT8H",
                };
                const wrongId = period.per_id+100000;

                let error;
                await testServer
                    .put(apiPutAndDeletePath(user.usr_id, wrongId), payload)
                    .catch(e => error = e);
                expect(error.response.status).toBe(404);
                expect(error.response.data.message).toBe(`Could not find period with id '${wrongId}'`);
            });
            
            describe("with another user", () => {
                let anotherUser;
                let anotherPeriod;

                beforeAll(async (done) => {
                    const result = await client.query(createUserSql,['Mister', 'Anderson', 'mister@anderson.com','2001-01-01', '38:30:00']);
                    anotherUser = R.head(result.rows);
                    anotherPeriod = await createPeriodStubWithDayForUserAndDate(client, anotherUser.usr_id, date);
                    done();
                });

                afterAll(async (done) => {
                    await client.query(`DELETE FROM days WHERE day_usr_id = ${anotherUser.usr_id}`);
                    await client.query(`DELETE FROM user_target_times WHERE utt_usr_id = ${anotherUser.usr_id}`);
                    await client.query(`DELETE FROM users WHERE usr_id = ${anotherUser.usr_id}`);
                    done();
                });

                it("should fail if period belongs to other user", async () => {
                    const payload = {
                        date,
                        per_pty_id: 'Work',
                        per_start: "PT8H",
                    };
                    let error;
                    await testServer
                        .put(apiPutAndDeletePath(user.usr_id, anotherPeriod.per_id), payload)
                        .catch(e => error = e);
                    expect(error.response.status).toBe(404);
                    expect(error.response.data.message).toBe(`Could not find period with id '${anotherPeriod.per_id}'`);
                });
            });
        });

        describe("testing delete (DELETE)", () => {
            let period;
            const date = '2001-03-01';

            beforeAll(async (done) => {
                period = await createPeriodStubWithDayForUserAndDate(client, user.usr_id, date);
                done();
            });

            afterAll(async (done) => {
                await client.query(`DELETE FROM days WHERE day_id = ${period.per_day_id}`);
                done();
            });

            it("should delete the period", async () => {
                const {data, status} = await testServer.delete(apiPutAndDeletePath(user.usr_id, period.per_id));
                expect(status).toBe(204);

                const result = await client.query(`SELECT * from periods WHERE per_id = ${period.per_id}`);
                expect(result.rows.length).toBe(0);
            });

            it("should not throw any errors if period is unknown", async () => { 
                const {data, status} = await testServer.delete(apiPutAndDeletePath(user.usr_id, period.per_id+10000));
                expect(status).toBe(204);
            }); 
        });
    });
});