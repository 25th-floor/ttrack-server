jest.dontMock('chakram');

import chakram from 'chakram';
import { getDatabasePool, createUserWithTargetTime } from '../../common/testUtils';

const expect = chakram.expect;

const API_URI_USER_TIMESHEET = 'http://localhost:8081/api/users/$user/timesheet/$from/$to';

const pool = getDatabasePool();
const userFixture = {
    usr_firstname: 'Mister',
    usr_lastname: 'Smith',
    usr_email: 'mister@smith.com',
    usr_employment_start: '2001-01-01',
};

const getApiUri = (id, from, to) =>
    API_URI_USER_TIMESHEET.replace('$user', id)
        .replace('$from', from)
        .replace('$to', to);

describe("ttrack API /api/users/{id}/timesheet/{from}/{to}", function () {
    let client;
    let user;
    let uri;

    beforeAll(async (done) => {
        client = await pool.connect();
        const response = await createUserWithTargetTime(client, userFixture, '38:30:00', '2001-01-01');
        user = response.user;
        uri = getApiUri(user.usr_id, '2001-02-01', '2001-03-01');
        done();
    });

    afterAll(async (done) => {
        await client.query(`DELETE FROM users WHERE usr_id = ${user.usr_id}`);
        client.release();
        await pool.end();
        done();
    });

    describe("testing create(GET)", () => {
        it("should return success", function () {
            const response = chakram.get(uri);
            return expect(response).to.have.status(200);
        });

        it("should return the carry information", function () {
            return chakram.get(uri).then(response => {
                return expect(response).to.comprise.of.json({
                    carryTime: { hours: -177, minutes: -6 },
                    carryFrom: "2001-01-01T00:00:00.000Z",
                    carryTo: "2001-01-31T00:00:00.000Z",
                });
            });
        });

        it("should return 29 days", function () {
            return chakram.get(uri).then(response => {
                return expect(response).to.comprise.of.json(function (data) {
                    expect(data.days).to.have.length(29);
                });
            });
        });

        it("should return have day information", function () {
            return chakram.get(uri).then(response => {
                return expect(response).to.comprise.of.json(function (data) {
                    expect(data.days[0]).to.eql({
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
                })
            });
        });
    });

    describe("should only support GET calls", () => {
        it("should NOT support POST calls", () => {
            expect(chakram.post(uri, {}, {})).to.have.status(405);
            return chakram.wait();
        });

        it("should NOT support PUT calls", () => {
            expect(chakram.put(uri, {}, {})).to.have.status(405);
            return chakram.wait();
        });

        it("should NOT support DELETE calls", () => {
            expect(chakram.delete(uri, {}, {})).to.have.status(405);
            return chakram.wait();
        });

        it("should NOT support PATCH calls", () => {
            expect(chakram.patch(uri, {}, {})).to.have.status(405);
            return chakram.wait();
        });
    });

});
