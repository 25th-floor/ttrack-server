import Glue from 'glue';
import path from 'path';
import R from 'ramda';
import { query } from '../../pg';
import manifest from '../../config/manifest';
import { holidayControlFlow } from '../../resources/timesheet';
import moment from 'moment';

const relativeTo = path.join(__dirname, '../../');

const createUserSql = 'SELECT * FROM create_user( $1, $2, $3, $4, $5)';

describe('Test TimeSheet functions', () => {
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

    describe('Holiday Creation', async ()=>{
        let user;
        const dateRange = {
            start: moment('2001-01-01'),
            end: moment('2001-01-20'),
        };

        beforeAll(async (done) => {
            user = await query(createUserSql, ['Mister', 'Smith', 'mister@smith.com', '2001-01-01', '38:30:00']);
            user = R.head(user.rows);
            done();
        });

        afterAll(async (done) => {
            Server.log([],`DELETE FROM users WHERE usr_id = ${user.usr_id}`);
            await query(`DELETE FROM days WHERE day_usr_id = ${user.usr_id}`);
            await query(`DELETE FROM user_target_times WHERE utt_usr_id = ${user.usr_id}`);
            await query(`DELETE FROM users WHERE usr_id = ${user.usr_id}`);
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