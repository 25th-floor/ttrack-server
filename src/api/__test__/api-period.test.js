import Glue from 'glue'; 
import path from 'path';
import R from 'ramda';
import { query } from '../../pg';
import manifest from '../../config/manifest'; 
import { PERIOD_TYPE_IDS, createPeriodStubWithDayForUserAndDate } from '../../common/testUtils';

const relativeTo = path.join(__dirname, '../../');

const dummyUserSql = 'INSERT INTO users (usr_firstname , usr_lastname, usr_email, usr_employment_start) VALUES ( $1, $2, $3, $4) RETURNING *';

const apiCreatePath = (user) => `/api/users/${user}/periods/`;
const apiPutAndDeletePath = (user,per_id) => `/api/users/${user}/periods/${per_id}`;

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

    describe('Periods /api/users/{id}/periods', async ()=>{

        let user;
        beforeAll(async (done) => {
            user = await query(dummyUserSql,['Mister', 'Smith', 'mister@smith.com','2001-01-01']);
            user = R.head(user.rows);
            //TODO impl test target = await query(targetTimeSql,[user.usr_id, '2001-02-01', 'infinity', '38:30:00']);
            done();
        });

        afterAll(async (done) => {
            await query(`DELETE FROM days WHERE day_usr_id = ${user.usr_id}`);
            await query(`DELETE FROM users WHERE usr_id = ${user.usr_id}`);
            done();
        });

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

        describe("testing create(POST)", async () => {
            it("should fail with missing date", async () => {
                const response  = await Server.inject({ method: 'POST', payload:{} , url: apiCreatePath(user.usr_id) });
                expect(response.statusCode).toBe(400);
                expect(response.result.message).toBe('child "date" fails because ["date" is required]');
            });
            
            it("should fail with missing Period Type", async () => {
                const response  = await Server.inject({ method: 'POST', payload:{ "date": "2001-01-01" } , url: apiCreatePath(user.usr_id) });
                expect(response.statusCode).toBe(400);
                expect(response.result.message).toBe('child "per_pty_id" fails because ["per_pty_id" is required]');
            });
            
            it("should fail with missing per_start‌⁠", async () => {
                const response  = await Server.inject({ 
                    method: 'POST',
                    payload: {
                        "date": "2001-01-01",
                        "per_pty_id": "Work" 
                    },
                    url: apiCreatePath(user.usr_id) 
                });
                expect(response.statusCode).toBe(400);
                expect(response.result.message).toBe('child "per_start" fails because ["per_start" is required]');
            });

            it("should succeed on success", async () => {
                const response  = await Server.inject({ 
                    method: 'POST',
                    payload: {
                        "date": "2001-01-01",
                        "per_pty_id": "Work",
                        "per_start": "PT8H",
                    },
                    url: apiCreatePath(user.usr_id)
                });

                expect(response.statusCode).toBe(201);
                expect(response.result).toMatchObject({
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
                const response  = await Server.inject({ 
                    method: 'POST',
                    payload: {
                        "per_pty_id": "Work",
                        "per_start": "PT8H",
                        "per_stop": "PT10H",
                        "date": "2001-01-02",
                    },
                    url: apiCreatePath(user.usr_id)
                });

                expect(response.statusCode).toBe(201);
                expect(response.result).toMatchObject({
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
                const response  = await Server.inject({ 
                    method: 'POST',
                    payload: {
                        "per_pty_id": "Work",
                        "per_start": "PT8H",
                        "per_stop": "PT10H",
                        "per_break": "PT30M",
                        "date": "2001-01-02",
                    },
                    url: apiCreatePath(user.usr_id)
                });

                expect(response.statusCode).toBe(201);
                expect(response.result).toMatchObject({
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
                const response  = await Server.inject({ 
                    method: 'POST',
                    payload: {
                        "per_pty_id": "Work",
                        "per_start": "PT8H",
                        "per_stop": "PT10H",
                        "per_break": "PT30M",
                        "per_comment": "example",
                        "date": "2001-01-02",
                    },
                    url: apiCreatePath(user.usr_id)
                });

                expect(response.statusCode).toBe(201);
                expect(response.result).toMatchObject({
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
        });

        describe("testing available PeriodTypes", () => {
            PERIOD_TYPE_IDS.forEach((type, index) => {
                it(`should work with periodType '${type}'`,async () => {
                    const payload = {
                        "per_pty_id": type,
                        "per_start": "PT8H",
                        "date": `2001-02-${index + 1}`,
                    };

                    const response = await Server.inject({
                        method: 'POST',
                        payload,
                        url: apiCreatePath(user.usr_id)
                    });
                    expect(response.statusCode).toBe(201);
                    expect(response.result).toMatchObject({
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
                period = await createPeriodStubWithDayForUserAndDate(user.usr_id, date);
                done();
            });

            afterAll(async (done) => {
                await query(`DELETE FROM days WHERE day_id = ${period.per_day_id}`);
                done();
            });

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
            
            it(`should return 404 Status code on PUT with userID of 0`, async ()=>{
                const response  = await Server.inject({ 
                    method: 'PUT',
                    payload: {
                        date,
                        "per_pty_id": 'Work',
                        "per_start": "PT8H",
                    },
                    url: apiPutAndDeletePath(0, period.per_id) });
                expect(response.statusCode).toBe(404);
            });

            it(`should return 404 Status code on PUT with period.per_id of 0`, async ()=>{
                const response  = await Server.inject({ 
                    method: 'PUT',
                    payload: {
                        date,
                        "per_pty_id": 'Work',
                        "per_start": "PT8H",
                    },
                    url: apiPutAndDeletePath(user.usr_id, 0) });
                expect(response.statusCode).toBe(404);
            });

            it(`should return 404 Status code on DELETE with user.usr_id of 0`, async ()=>{
                const response  = await Server.inject({ 
                    method: 'DELETE',
                    url: apiPutAndDeletePath(0, user.usr_id) });
                expect(response.statusCode).toBe(404);
            });

            it("should fail if payload is empty", async () => {
                const response  = await Server.inject({ 
                    method: 'PUT',
                    payload: {},
                    url: apiPutAndDeletePath(user.usr_id, period.per_id)
                });
                expect(response.statusCode).toBe(400);
                expect(response.result.message).toBe('child "date" fails because ["date" is required]');
            });

            it("should fail if missing the period type", async () => {
                const response  = await Server.inject({ 
                    method: 'PUT',
                    payload: {
                        date,
                    },
                    url: apiPutAndDeletePath(user.usr_id, period.per_id)
                });
                expect(response.statusCode).toBe(400);
                expect(response.result.message).toBe('child "per_pty_id" fails because ["per_pty_id" is required]');
            });

            it("should fail if missing start", async () => {
                const response  = await Server.inject({ 
                    method: 'PUT',
                    payload: {
                        date,
                        per_pty_id: 'Work',
                    },
                    url: apiPutAndDeletePath(user.usr_id, period.per_id)
                });
                expect(response.statusCode).toBe(400);
                expect(response.result.message).toBe('child "per_start" fails because ["per_start" is required]');
            });

            it("should work on success", async () => {
                const response  = await Server.inject({ 
                    method: 'PUT',
                    payload: {
                        date,
                        "per_pty_id": 'Work',
                        "per_start": "PT8H",
                    },
                    url: apiPutAndDeletePath(user.usr_id, period.per_id)
                });
                expect(response.statusCode).toBe(200);
                expect(response.result).toMatchObject({
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
                const response  = await Server.inject({ 
                    method: 'PUT',
                    payload,
                    url: apiPutAndDeletePath(user.usr_id, period.per_id)
                });
                expect(response.statusCode).toBe(200);
                expect(response.result).toMatchObject({
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
                const response  = await Server.inject({
                    method: 'PUT',
                    payload,
                    url: apiPutAndDeletePath(user.usr_id, wrongId)
                });
                expect(response.statusCode).toBe(404);
                expect(response.result.message).toBe(`Could not find period with id '${wrongId}'`);
            });

            describe("with another user", () => {
                let anotherUser;
                let anotherPeriod;

                beforeAll(async (done) => {
                    const result = await query(dummyUserSql,['Mister', 'Anderson', 'mister@anderson.com','2001-01-01']);
                    anotherUser = R.head(result.rows);
                    anotherPeriod = await createPeriodStubWithDayForUserAndDate(anotherUser.usr_id, date);
                    done();
                });

                afterAll(async (done) => {
                    await query(`DELETE FROM days WHERE day_usr_id = ${anotherUser.usr_id}`);
                    await query(`DELETE FROM users WHERE usr_id = ${anotherUser.usr_id}`);
                    done();
                });

                it("should fail if period belongs to other user", async () => {
                    const payload = {
                        date,
                        per_pty_id: 'Work',
                        per_start: "PT8H",
                    };
                    const response  = await Server.inject({
                        method: 'PUT',
                        payload,
                        url: apiPutAndDeletePath(user.usr_id, anotherPeriod.per_id)//?
                    });
                    expect(response.statusCode).toBe(404);
                    expect(response.result.message).toBe(`Could not find period with id '${anotherPeriod.per_id}'`);
                });
            });
        });

        describe("testing delete (DELETE)", () => {
            let period;
            const date = '2001-03-01';

            beforeAll(async (done) => {
                period = await createPeriodStubWithDayForUserAndDate(user.usr_id, date);
                done();
            });

            afterAll(async (done) => {
                await query(`DELETE FROM days WHERE day_id = ${period.per_day_id}`);
                done();
            });

            it("should delete the period", async () => {
                const response  = await Server.inject({ 
                    method: 'DELETE',
                    payload: {},
                    url: apiPutAndDeletePath(user.usr_id, period.per_id)
                });
                expect(response.statusCode).toBe(204);
                const result = await query(`SELECT * from periods WHERE per_id = ${period.per_id}`);
                expect(result.rows.length).toBe(0);
            });

            it("should not throw any errors if period is unknown", async () => { 
                const response  = await Server.inject({  
                    method: 'DELETE', 
                    payload: {}, 
                    url: apiPutAndDeletePath(user.usr_id, period.per_id+10000) 
                }); 
                expect(response.statusCode).toBe(204); 
            }); 
        });
    });
});