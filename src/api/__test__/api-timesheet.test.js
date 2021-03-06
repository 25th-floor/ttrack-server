import Glue from 'glue';
import path from 'path';
import R from 'ramda';
import { query } from '../../pg';
import manifest from '../../config/manifest';

const relativeTo = path.join(__dirname, '../../');

const createUserSql = 'SELECT * FROM create_user( $1, $2, $3, $4, $5)';

const apiPath = (user, from, to) => `/api/users/${user}/timesheet/${from}/${to}`;

describe('ttrack API', () => {
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

    describe("Timesheet api/users/${user}/timesheet/${from}/${to}", async () => {
        let user;
        // let target;
        beforeAll(async (done) => {
            user = await query(createUserSql, ['Mister', 'Smith', 'mister@smith.com', '2001-01-01', '38:30:00']);
            user = R.head(user.rows);
            await query('UPDATE users SET usr_employment_end = $2 WHERE usr_id = $1', [user.usr_id, '2001-12-31']);
            done();
        });

        afterAll(async (done) => {
            await query(`DELETE FROM days WHERE day_usr_id = ${user.usr_id}`);
            await query(`DELETE FROM user_target_times WHERE utt_usr_id = ${user.usr_id}`);
            await query(`DELETE FROM users WHERE usr_id = ${user.usr_id}`);
            done();
        });

        describe('testing GET', () => {
            it('should return success', async () => {
                const response = await Server.inject({
                    method: 'GET',
                    url: apiPath(user.usr_id, '2001-02-01', '2001-03-01')
                });
                expect(response.statusCode).toBe(200);
            });

            it('should return 404 with user.usr_id 0', async () => {
                const response = await Server.inject({
                    method: 'GET',
                    url: apiPath(0, '2001-02-01', '2001-03-01')
                });
                expect(response.statusCode).toBe(404);
            });

            it('should return 404 if it is before the user started', async () => {
                const response = await Server.inject({
                    method: 'GET',
                    url: apiPath(user.usr_id, '2000-02-01', '2000-03-01')
                });
                expect(response.statusCode).toBe(404);
            });

            it("should return the carry information", async () => {
                const response = await Server.inject({
                    method: 'GET',
                    url: apiPath(user.usr_id, '2001-02-01', '2001-03-01')
                });
                expect(response.result).toMatchObject({
                    carryTime: { hours: -177, minutes: -6 },
                    carryFrom: "2001-01-01T00:00:00.000Z",
                    carryTo: "2001-01-31T00:00:00.000Z",
                });
            });

            it("should return 29 days", async () => {
                const response = await Server.inject({
                    method: 'GET',
                    url: apiPath(user.usr_id, '2001-02-01', '2001-03-01')
                });
                expect(response.result.days.length).toBe(29);
            });

            it("should return 20 days", async () => {
                const response = await Server.inject({
                    method: 'GET',
                    url: apiPath(user.usr_id, '2001-01-01', '2001-01-20')
                });
                expect(response.result.days.length).toBe(20);
            });

            it("should return have day information", async () => {
                const response = await Server.inject({
                    method: 'GET',
                    url: apiPath(user.usr_id, '2001-02-01', '2001-03-01')
                });

                expect(response.result.days[0]).toMatchObject({
                    day_id: null,
                    day_date: "2001-02-01T00:00:00.000Z",
                    day_usr_id: user.usr_id,
                    day_target_time: {
                        hours: 7,
                        minutes: 42
                    },
                    periods: [],
                    remaining: {
                        hours: 7,
                        minutes: 42
                    },
                });
            });

            it('should return 404 if it is after the user ended', async () => {
                const response = await Server.inject({
                    method: 'GET',
                    url: apiPath(user.usr_id, '2002-02-01', '2002-03-01')
                });
                expect(response.statusCode).toBe(404);
            });

            it('should return 10 days with startdate before user started', async () => {
                const response = await Server.inject({
                    method: 'GET',
                    url: apiPath(user.usr_id, '2000-12-01', '2001-01-10')
                });
                expect(response.statusCode).toBe(200);
                expect(response.result.days.length).toBe(10);
                expect(response.result).toMatchObject({
                    carryTime: { },
                    carryFrom: "2000-12-31T00:00:00.000Z",
                    carryTo: "2000-12-31T00:00:00.000Z",
                });
            });

            it('should return 10 days with enddate after user started', async () => {
                const response = await Server.inject({
                    method: 'GET',
                    url: apiPath(user.usr_id, '2001-12-22', '2002-01-31')
                });
                expect(response.statusCode).toBe(200);
                expect(response.result.days.length).toBe(10);
                expect(response.result).toMatchObject({
                    carryTime: { hours: -1955, minutes: -48 },
                    carryFrom: "2001-01-01T00:00:00.000Z",
                    carryTo: "2001-12-21T00:00:00.000Z",
                });
            });

        });

        describe('Test Method not implemented', () => {
            it('POST', async () => {
                const response = await Server.inject({
                    method: 'POST',
                    url: apiPath(user.usr_id, '2001-02-01', '2001-03-01')
                });
                expect(response.statusCode).toBe(405);
            });
            it('DELETE', async () => {
                const response = await Server.inject({
                    method: 'DELETE',
                    url: apiPath(user.usr_id, '2001-02-01', '2001-03-01')
                });
                expect(response.statusCode).toBe(405);
            });
            it('PUT', async () => {
                const response = await Server.inject({
                    method: 'PUT',
                    url: apiPath(user.usr_id, '2001-02-01', '2001-03-01')
                });
                expect(response.statusCode).toBe(405);
            });
            it('PATCH', async () => {
                const response = await Server.inject({
                    method: 'PATCH',
                    url: apiPath(user.usr_id, '2001-02-01', '2001-03-01')
                });
                expect(response.statusCode).toBe(405);
            });
        });
    });
});