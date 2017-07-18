jest.dontMock('chakram');

import chakram from 'chakram';
import { getDatabasePool, createUser } from '../../common/testUtils';

const expect = chakram.expect;

const API_URI_USERS = "http://localhost:8081/api/users";

const pool = getDatabasePool();
const userFixture = {
    usr_firstname: 'Mister',
    usr_lastname: 'Smith',
    usr_email: 'mister@smith.com',
};

describe("ttrack API /api/users", function () {
    let client;
    let user;

    describe("testing GET request", () => {
        beforeAll(async (done) => {
            client = await pool.connect();
            user = await createUser(client, userFixture);
            done();
        });

        afterAll(async (done) => {
            await client.query(`DELETE FROM users WHERE usr_id = ${user.usr_id}`);
            client.release();
            await pool.end();
            done();
        });

        it("should return 200 on success", function () {
            const response = chakram.get(API_URI_USERS);
            return expect(response).to.have.status(200);
        });

        it("should have one result", function () {
            const response = chakram.get(API_URI_USERS);
            return expect(response).to.have.json(function (typesArray) {
                expect(typesArray).to.not.have.length(0);
            })
        });

    });

    describe("should only support GET calls", () => {
        it("should NOT support POST calls", () => {
            expect(chakram.post(API_URI_USERS, {}, {})).to.have.status(405);
            return chakram.wait();
        });
        it("should NOT support PUT calls", () => {
            expect(chakram.put(API_URI_USERS, {}, {})).to.have.status(405);
            return chakram.wait();
        });
        it("should NOT support DELETE calls", () => {
            expect(chakram.delete(API_URI_USERS, {}, {})).to.have.status(405);
            return chakram.wait();
        });
        it("should NOT support PATCH calls", () => {
            expect(chakram.patch(API_URI_USERS, {}, {})).to.have.status(405);
            return chakram.wait();
        });
    });
});