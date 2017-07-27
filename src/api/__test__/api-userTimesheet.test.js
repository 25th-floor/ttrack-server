import Glue from 'glue'; 
import path from 'path';
import R from 'ramda';
import { query } from '../../pg';
import manifest from '../../config/manifest'; 

const relativeTo = path.join(__dirname, '../../');

const dummyUserSql = 'INSERT INTO users (usr_firstname , usr_lastname, usr_email, usr_employment_start) VALUES ( $1, $2, $3, $4) RETURNING *';
//const targetTimeSql = 'INSERT INTO user_target_times (utt_usr_id , utt_start, utt_end, utt_target_time) VALUES ( $1, $2, $3, $4 ) RETURNING *';

const apiPath = (user, from, to) => `/api/users/${user}/timesheet/${from}/${to}`;

describe.skip('API',() => {
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

    describe("api/users/${user}/timesheet/${from}/${to}", async () => {
        let user;
        // let target;
        beforeAll(async (done) => {
            user = await query(dummyUserSql,['Mister', 'Smith', 'mister@smith.com','2001-01-01']);
            user = R.head(user.rows);
            //TODO impl test target = await query(targetTimeSql,[user.usr_id, '2001-02-01', 'infinity', '38:30:00']);
            done();
        });

        afterAll(async (done) => {
            await query(`DELETE FROM user_target_times WHERE utt_usr_id = ${user.usr_id}`);
            await query(`DELETE FROM users WHERE usr_id = ${user.usr_id}`);
            done();
        });

        describe(' GET ', ()=>{
            it('statusCode', async () => {
                const response  = await Server.inject({ method: 'GET', url: apiPath(user.usr_id, '2001-02-01',  '2001-03-01') });
                expect(response.statusCode).toBe(200);
            });
        });

        describe('Test Method not implemented', ()=>{
            it('POST', async ()=>{
                const response  = await Server.inject({ method: 'POST' , url: apiPath(user.usr_id, '2001-02-01',  '2001-03-01') });
                expect(response.statusCode).toBe(405);
            });
            it('DELETE', async ()=>{
                const response  = await Server.inject({ method: 'DELETE' , url: apiPath(user.usr_id, '2001-02-01',  '2001-03-01') });
                expect(response.statusCode).toBe(405);
            });
            it('PUT', async ()=>{
                const response  = await Server.inject({ method: 'PUT' , url: apiPath(user.usr_id, '2001-02-01',  '2001-03-01') });
                expect(response.statusCode).toBe(405);
            });
            it('PATCH', async ()=>{
                const response  = await Server.inject({ method: 'PATCH' , url: apiPath(user.usr_id, '2001-02-01',  '2001-03-01') });
                expect(response.statusCode).toBe(405);
            });
        });
    });
});