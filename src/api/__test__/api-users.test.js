import { testServer, createDatabaseConnection } from './utils';
import JasmineExpect from 'jasmine-expect'; /* eslint-disable-line no-unused-vars */

import R from 'ramda';
import moment from 'moment';

const dummyUserSql = 'INSERT INTO users (usr_firstname , usr_lastname, usr_email) VALUES ( $1, $2, $3 ) RETURNING *';

// const apiUserPath = (user) => `/api/users/${user}`;

jest.setTimeout(15000);

describe('ttrack API', () => {
    describe("Users /api/users", async () => {
        let user;
        let client;
        beforeAll(async () => {
            client = await createDatabaseConnection();

            user = await client.query(dummyUserSql, ['Mister', 'Smith', 'mister@smith.com']);
            user = R.head(user.rows);
        });

        afterAll(async () => {
            await client.query(`DELETE FROM users WHERE usr_id = ${user.usr_id}`);
            await client.release();
        });

        describe('Database Tests', () => {
            it('RAW SQL Get user with id x', async () => {
                const result = [{
                    usr_id: user.usr_id,
                    usr_lastname: 'Smith',
                    usr_email: 'mister@smith.com',
                    usr_firstname: 'Mister',
                    usr_employment_start: null,
                    usr_employment_end: null
                }];
                const res = await client.query('SELECT * FROM users WHERE usr_id = $1', [user.usr_id]);
                expect(res.rows).toEqual(result);
            });

            // Should move into a own test
            describe('Create pg connection', async () => {
                await it('test multiple querys on single connection', async () => {
                    const result = [{
                        usr_id: user.usr_id,
                        usr_lastname: 'Smith',
                        usr_email: 'mister@smith.com',
                        usr_firstname: 'Mister',
                        usr_employment_start: null,
                        usr_employment_end: null
                    }];
                    const resultOne = await client.query('SELECT * FROM users WHERE usr_id = $1', [user.usr_id]);
                    const resultTwo = await client.query('SELECT * FROM users WHERE usr_id = $1', [user.usr_id]);
                    client.release();
                    expect(resultOne.rows).toEqual(result);
                    expect(resultTwo.rows).toEqual(result);
                });
            });

        });

        describe('testing GET requests', () => {
            const userFixture = {
                usr_lastname: 'Smith',
                usr_email: 'mister@smith.com',
                usr_firstname: 'Mister',
                usr_employment_start: null,
                usr_employment_end: null
            };

            it('GET Api /api/users returns our users', async () => {
                //let uri = Server.lookup('UserList').path;
                const {data, status} = await testServer.get('/api/users');
                expect(status).toEqual(200);
                expect(data).toBeArrayOfObjects();//?

                const users = R.filter(
                    R.propEq('usr_id',user.usr_id)
                )(data);

                expect(R.head(users)).toMatchObject({
                    ...userFixture,
                    usr_id: user.usr_id,
                });
            });

            it(`GET Api /api/users/{id}`, async () => {
                const result = [{
                    ...userFixture,
                    usr_id: user.usr_id,
                }];
                const {data, status} = await testServer.get(`/api/users/${user.usr_id}`);
                expect(status).toBe(200);
                expect(data).toEqual(R.head(result));
            });

            it(`should return 404 with user id 0`, async () => {
                let status;
                await testServer.get(`/api/users/${0}`)
                    .catch(error => status = error.response.status);
                expect(status).toBe(404);
            });

            it('should return users that are only available within this month', async () => {
                const today = moment();
                const start = today.clone().subtract(1, 'month').format("YYYY-MM-DD");
                const end = today.clone().add(1, 'month').format("YYYY-MM-DD");

                const sql = 'UPDATE users SET usr_employment_start = $1, usr_employment_end = $2 WHERE usr_id = $3 RETURNING *';
                await client.query(sql, [start, end, user.usr_id]);

                const {data, status} = await testServer.get('/api/users');
                expect(status).toEqual(200);
                expect(data).toBeArrayOfObjects();

                const users = R.filter(
                    R.propEq('usr_id',user.usr_id)
                )(data);

                expect(R.head(users)).toMatchObject({
                    ...user,
                    usr_id: user.usr_id,
                    usr_employment_start: new Date(start).toISOString(),
                    usr_employment_end: new Date(end).toISOString()
                });
            });

            it('should ignore users that are no longer active', async () => {
                const today = moment();
                const start = today.clone().subtract(1, 'month').format("YYYY-MM-DD");
                const end = today.clone().subtract(1, 'day').format("YYYY-MM-DD");

                const sql = 'UPDATE users SET usr_employment_start = $1, usr_employment_end = $2 WHERE usr_id = $3 RETURNING *';
                await client.query(sql, [start, end, user.usr_id]);

                const {data, status} = await testServer.get('/api/users');
                expect(status).toEqual(200);
                expect(data).toBeArrayOfObjects();

                const users = R.filter(
                    R.propEq('usr_id',user.usr_id)
                )(data);

                expect(users).toBeEmptyArray();
            });
        });
    /*
        describe('Test Method not implemented', ()=>{
            it(`Should fail method is not implemented POST on /api/users`, async ()=>{
                const {status} = await testServer.post('/api/users', {});
                expect(status).toEqual(405);
            });

            it(`Should fail method is not implemented PUT on ${apiUserPath('{user.usr_id}')}`, async () => {
                const {status} = await testServer.put(`/api/users/${user.usr_id}`, {});
                expect(status).toEqual(405);
            });

            it(`Should fail method is not implemented DELETE on ${apiUserPath('{user.usr_id}')}`, async () => {
                const {status} = await testServer.delete(`/api/users/${user.usr_id}`);
                expect(status).toEqual(405);
            });

            it(`Should fail method is not implemented PATCH on ${apiUserPath('{user.usr_id}')}`, async () => {
                const {status} = await testServer.patch(`/api/users/${user.usr_id}`, {});
                expect(status).toEqual(405);
            });

        });
    */
    });
});