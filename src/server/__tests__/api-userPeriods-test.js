jest.dontMock('chakram');

import chakram from 'chakram';
import { getDatabasePool, createUser, PERIOD_TYPE_IDS, createPeriodStubWithDayForUserAndDate } from '../../common/testUtils';

const expect = chakram.expect;

const API_URI_USER_PERIODS = 'http://localhost:8080/api/users/$user/periods';

const pool = getDatabasePool();
const userFixture = {
    usr_firstname: 'Mister',
    usr_lastname: 'Smith',
    usr_email: 'mister@smith.com',
};

const getApiUri = id => API_URI_USER_PERIODS.replace('$user', id);

describe("ttrack API /api/users/{id}/periods", function () {
    let client;
    let user;
    let uri;

    beforeAll(async (done) => {
        client = await pool.connect();
        user = await createUser(client, userFixture);
        uri = getApiUri(user.usr_id);

        chakram.addMethod("body", function (respObj, text) {
            const body = respObj.response.body;
            this.assert(body.indexOf(text) > -1, `Expected '${text}' to be found within responses body ${body}`);
        });
        done();
    });

    afterAll(async (done) => {
        await client.query(`DELETE FROM days WHERE day_usr_id = ${user.usr_id}`);
        await client.query(`DELETE FROM users WHERE usr_id = ${user.usr_id}`);
        client.release();
        await pool.end();
        done();
    });

    describe("testing create(POST)", () => {
        it("should fail if body is empty", function () {
            return chakram.post(uri, {}, {})
                .then((response) => {
                    expect(response).to.have.status(400);
                    expect(response).to.have.body("Missing Period Type!");
                });
        });

        it("should fail with missing start or duration", function () {
            return chakram.post(uri, { "per_pty_id": "Work" }, {})
                .then((response) => {
                    expect(response).to.have.status(400);
                    expect(response).to.have.body("Missing Data 'Start' or 'Duration'!");
                });
        });

        it("should fail with missing date", function () {
            const data = {
                "per_pty_id": "Work",
                "per_start": "PT8H",
            };
            return chakram.post(uri, data, {})
                .then((response) => {
                    expect(response).to.have.status(400);
                    expect(response).to.have.body("Missing Date!");
                });
        });

        it("should succeed on success", function () {
            const data = {
                "per_pty_id": "Work",
                "per_start": "PT8H",
                "date": "2001-01-01",
            };
            return chakram.post(uri, data, {})
                .then((response) => {
                    expect(response).to.have.status(201);
                    expect(response).to.comprise.of.json({
                        per_pty_id: "Work",
                        per_start: {
                            hours: 8,
                            minutes: 0,
                        },
                        per_stop: null,
                        per_break: null,
                        per_comment: null,
                        per_duration: {},
                    })
                });
        });

        it("should set duration correctly", function () {
            const data = {
                "per_pty_id": "Work",
                "per_start": "PT8H",
                "per_stop": "PT10H",
                "date": "2001-01-02",
            };
            return chakram.post(uri, data, {})
                .then((response) => {
                    expect(response).to.have.status(201);
                    expect(response).to.comprise.of.json({
                        per_pty_id: "Work",
                        per_start: {
                            hours: 8,
                            minutes: 0,
                        },
                        per_stop: {
                            hours: 10,
                            minutes: 0,
                        },
                        per_break: null,
                        per_comment: null,
                        per_duration: {
                            hours: 2,
                        },
                    })
                });
        });

        it("should set break correctly", function () {
            const data = {
                "per_pty_id": "Work",
                "per_start": "PT8H",
                "per_stop": "PT10H",
                "per_break": "PT30M",
                "date": "2001-01-03",
            };
            return chakram.post(uri, data, {})
                .then((response) => {
                    expect(response).to.have.status(201);
                    expect(response).to.comprise.of.json({
                        per_pty_id: "Work",
                        per_start: {
                            hours: 8,
                            minutes: 0,
                        },
                        per_stop: {
                            hours: 10,
                            minutes: 0,
                        },
                        per_break: {
                            minutes: 30,
                        },
                        per_comment: null,
                        per_duration: {
                            hours: 2,
                        },
                    })
                });
        });

        it("should set comments", function () {
            const data = {
                "per_pty_id": "Work",
                "per_start": "PT8H",
                "per_comment": "example",
                "date": "2001-01-04",
            };
            return chakram.post(uri, data, {})
                .then((response) => {
                    expect(response).to.have.status(201);
                    expect(response).to.comprise.of.json({
                        per_pty_id: "Work",
                        per_start: {
                            hours: 8,
                            minutes: 0,
                        },
                        per_stop: null,
                        per_break: null,
                        per_comment: "example",
                        per_duration: {},
                    })
                });
        });

        describe("testing available PeriodTypes", () => {
            PERIOD_TYPE_IDS.forEach((type, index) => {

                it(`should work with periodType '${type}'`, function () {
                    const data = {
                        "per_pty_id": type,
                        "per_start": "PT8H",
                        "date": `2001-02-${index + 1}`,
                    };
                    return chakram.post(uri, data, {})
                        .then((response) => {
                            expect(response).to.have.status(201);
                            expect(response).to.comprise.of.json({
                                per_pty_id: type,
                                per_start: {
                                    hours: 8,
                                    minutes: 0,
                                },
                                per_stop: null,
                                per_break: null,
                                per_comment: null,
                                per_duration: {},
                            })
                        });
                });

            });
        });
    });

    describe("testing udpate(PUT)", () => {
        let period;
        const date = '2001-03-01';
        let updateUri;

        beforeAll(async (done) => {
            period = await createPeriodStubWithDayForUserAndDate(client, user.usr_id, date);

            updateUri = `${uri}/${period.per_id}`;
            done();
        });

        afterAll(async (done) => {
            await client.query(`DELETE FROM days WHERE day_id = ${period.per_day_id}`);
            done();
        });

        it("should fail if body is empty", function () {
            return chakram.put(updateUri, {}, {})
                .then((response) => {
                    expect(response).to.have.status(400);
                    expect(response).to.have.body("Missing Period Type!");
                });
        });

        it("should fail if missing the period type", function () {
            const data = {
                per_id: period.per_id,
            };
            return chakram.put(updateUri, data, {})
                .then((response) => {
                    expect(response).to.have.status(400);
                    expect(response).to.have.body("Missing Period Type!");
                });
        });

        it("should fail if missing start or duration", function () {
            const data = {
                per_pty_id: 'Work',
            };
            return chakram.put(updateUri, data, {})
                .then((response) => {
                    expect(response).to.have.status(400);
                    expect(response).to.have.body("Missing Data 'Start' or 'Duration'!");
                });
        });

        it("should work on success", function () {
            const data = {
                per_pty_id: 'Work',
                per_start: "PT8H",
                per_stop: "PT10H",
            };
            return chakram.put(updateUri, data, {})
                .then((response) => {
                    expect(response).to.have.status(200);
                    expect(response).to.comprise.of.json({
                        ...period,
                        per_start: {
                            hours: 8,
                            minutes: 0,
                        },
                        per_stop: {
                            hours: 10,
                            minutes: 0,
                        },
                        per_duration: {
                            hours: 2,
                        },
                    })
                });
        });

        it("day id should not be changed", function () {
            const data = {
                per_pty_id: 'Work',
                per_start: "PT8H",
                per_day_id: period.per_day_id + 1,
            };
            return chakram.put(updateUri, data, {})
                .then((response) => {
                    expect(response).to.have.status(200);
                    expect(response).to.comprise.of.json({
                        per_day_id: period.per_day_id,
                    })
                });
        });

        it("should fail if period id is wrong", function () {
            const data = {
                per_pty_id: 'Work',
                per_start: "PT8H",
            };
            const wrongId = period.per_id + 10;
            const myUri = `${uri}/${wrongId}`;
            return chakram.put(myUri, data, {})
                .then((response) => {
                    expect(response).to.have.status(400);
                    expect(response).to.have.body(`Could not find period with id '${wrongId}'`);
                });
        });
    });

    describe("testing delete (DELETE)", () => {
        let period;
        const date = '2001-04-01';
        let deleteUri;

        beforeAll(async (done) => {
            period = await createPeriodStubWithDayForUserAndDate(client, user.usr_id, date);

            deleteUri = `${uri}/${period.per_id}`;
            done();
        });

        afterAll(async (done) => {
            await client.query(`DELETE FROM days WHERE day_id = ${period.per_day_id}`);
            done();
        });

        it("should delete the period", function () {
            return chakram.delete(deleteUri, {})
                .then(async (response) => {
                    expect(response).to.have.status(204);
                    const result = await client.query(`SELECT * from periods WHERE per_id = ${period.per_id}`);
                    expect(result.rows.length).to.equal(0);
                });
        });

        it("should not throw any errors if period is unknown", function () {
            deleteUri = `${uri}/${(period.per_id + 10)}`;
            return chakram.delete(deleteUri, {})
                .then((response) => {
                    expect(response).to.have.status(204);
                });
        });
    });

    describe("should only support POST calls", () => {
        it("should NOT support GET calls", () => {
            return expect(chakram.get(uri)).to.have.status(405);
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
