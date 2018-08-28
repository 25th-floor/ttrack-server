import { testServer, createDatabaseConnection } from './utils';
import JasmineExpect from 'jasmine-expect'; /* eslint-disable-line no-unused-vars */
import R from 'ramda';
import { holidayControlFlow } from '../../resources/timesheet';
import moment from 'moment';

const createUserSql = 'SELECT * FROM create_user( $1, $2, $3, $4, $5)';

describe.skip('Test TimeSheet functions', () => {
    describe('Holiday Creation', async ()=>{
        let client;
        let user;
        const dateRange = {
            start: moment('2001-01-01'),
            end: moment('2001-01-20'),
        };

        beforeAll(async (done) => {
            client = await createDatabaseConnection();
            user = await client.query(createUserSql, ['Mister', 'Smith', 'mister@smith.com', '2001-01-01', '38:30:00']);
            user = R.head(user.rows);
            done();
        });

        afterAll(async (done) => {
            console.log([],`DELETE FROM users WHERE usr_id = ${user.usr_id}`);
            await client.query(`DELETE FROM days WHERE day_usr_id = ${user.usr_id}`);
            await client.query(`DELETE FROM user_target_times WHERE utt_usr_id = ${user.usr_id}`);
            await client.query(`DELETE FROM users WHERE usr_id = ${user.usr_id}`);
            done();
        });

        it('should create Holiday Neujahr and Hl. Drei Könige', async () =>{
            if(user){
                const result = await holidayControlFlow(user,dateRange);
                expect(result).toBeArrayOfSize(2);
                expect(R.head(result)).toMatchObject({
                    "per_break": null,
                    "per_comment": "Neujahr",
                    "per_duration": {
                        "hours": 7,
                        "minutes": 42
                    },
                    "per_pty_id": "Holiday",
                    "per_start": null,
                    "per_stop": null,
                });
                expect(R.last(result)).toMatchObject({
                    "per_break": null,
                    "per_comment": "Hl. Drei Könige",
                    //"per_day_id": 110,
                    "per_duration": {},
                    //"per_id": 23,
                    "per_pty_id": "Holiday",
                    "per_start": null,
                    "per_stop": null,
                });
              
            }
        });


    });
});