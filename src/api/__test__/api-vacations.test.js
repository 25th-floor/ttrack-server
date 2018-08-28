import { testServer, createDatabaseConnection } from './utils';
import JasmineExpect from 'jasmine-expect'; /* eslint-disable-line no-unused-vars */
import R from 'ramda';

const dummyUserSql = 'INSERT INTO users (usr_firstname , usr_lastname, usr_email) VALUES ( $1, $2, $3 ) RETURNING *';
const daySql = 'INSERT INTO days (day_date, day_usr_id, day_target_time) VALUES ( $1, $2, $3) RETURNING *';
const periodSql = 'INSERT INTO periods (per_day_id, per_duration, per_pty_id) VALUES ( $1, $2, $3) RETURNING *';
const periodTypeVacation = 'Vacation';

const apiVacationPath = '/api/vacations';

describe('ttrack API', () => {
    describe("Vacations /api/vacations", async () => {
        let client;
        let user;
        let firstDay;
        let secondDay;
        let firstPeriod;
        let secondPeriod;
        beforeAll(async () => {
            client = await createDatabaseConnection();
            let result = await client.query(dummyUserSql, ['Mister', 'Smith', 'mister@smith.com']);
            user = R.head(result.rows);
            result = await client.query(daySql, ['2017-01-01', user.usr_id, '08:00:00']);
            firstDay = R.head(result.rows);
            result = await client.query(daySql, ['2017-01-02', user.usr_id, '08:00:00']);
            secondDay = R.head(result.rows);
            result = await client.query(periodSql, [firstDay.day_id, '08:00:00', periodTypeVacation]);
            firstPeriod = R.head(result.rows);
            result = await client.query(periodSql, [secondDay.day_id, '04:00:00', periodTypeVacation]);
            secondPeriod = R.head(result.rows);
        });

        afterAll(async () => {
            await client.query('DELETE FROM days WHERE day_usr_id = $1', [user.usr_id]);
            await client.query('DELETE FROM users WHERE usr_id = $1', [user.usr_id]);
        });

        describe('testing GET requests', () => {
            it('GET Api /api/vacations returns the vacations', async () => {
                //let uri = Server.lookup('UserList').path;
                const {data, status} = await testServer.get(apiVacationPath);
                expect(status).toBe(200);
                expect(data).toBeObject();
                expect(data._meta).toEqual({
                    "count": 2,
                    "limit": 2,
                    "start": 0,
                    "total": 2,
                });

                let vacation_dates = R.map(
                    R.prop('day_date')
                )(data.vacations);

                expect(vacation_dates).toEqual(expect.arrayContaining([
                    secondDay.day_date.toISOString(),
                    firstDay.day_date.toISOString()
                ]));
            });
            
            it('GET Api /api/vacations returns full day vacations', async () => {
                //let uri = Server.lookup('UserList').path;
                const {data, status} = await testServer.get(apiVacationPath);
                expect(status).toBe(200);

                let vacations = R.filter(
                    R.propEq('per_id',firstPeriod.per_id)
                )(data.vacations);

                expect(R.head(vacations)).toMatchObject({
                    day_id: firstDay.day_id,
                    day_date: firstDay.day_date.toISOString(),
                    day_target_time: firstDay.day_target_time,
                    usr_id: user.usr_id,
                    usr_firstname: user.usr_firstname,
                    usr_lastname: user.usr_lastname,
                    per_id: firstPeriod.per_id,
                    per_comment: firstPeriod.per_comment,
                    per_duration:firstPeriod.per_duration,
                });
            });

            it('GET Api /api/vacations returns half day vacations', async () => {
                //let uri = Server.lookup('UserList').path;
                const {data, status} = await testServer.get(apiVacationPath);
                expect(status).toBe(200);

                let vacations = R.filter(
                    R.propEq('per_id',secondPeriod.per_id)
                )(data.vacations);

                expect(R.head(vacations)).toMatchObject({
                    day_id: secondDay.day_id,
                    day_date: secondDay.day_date.toISOString(),
                    day_target_time: secondDay.day_target_time,
                    usr_id: user.usr_id,
                    usr_firstname: user.usr_firstname,
                    usr_lastname: user.usr_lastname,
                    per_id: secondPeriod.per_id,
                    per_comment: secondPeriod.per_comment,
                    per_duration:secondPeriod.per_duration,
                });
            });
            
        });
        /*
        describe('Test Method not implemented', ()=>{
            it(`Should fail method is not implemented POST on /api/vacations`, async ()=>{
                const response  = await Server.inject({ method: 'POST' , url: apiVacationPath });
                expect(response.statusCode).toBe(405);
            });

            it('Should fail method is not implemented PUT on /api/vacations', async () => {
                const PUT = await Server.inject({ method: 'PUT', url: apiVacationPath });
                expect(PUT.statusCode).toBe(405);
            });

            it('Should fail method is not implemented DELETE on /api/vacations', async () => {
                const DELETEmethod = await Server.inject({ method: 'DELETE', url: apiVacationPath });
                expect(DELETEmethod.statusCode).toBe(405);
            });

            it('Should fail method is not implemented PATCH on /api/vacations', async () => {
                const DELETEmethod = await Server.inject({ method: 'PATCH', url: apiVacationPath });
                expect(DELETEmethod.statusCode).toBe(405);
            });

        });
        */
    });
});