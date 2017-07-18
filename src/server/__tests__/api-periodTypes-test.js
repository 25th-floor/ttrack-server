jest.dontMock('chakram');

import chakram from 'chakram';
import { PERIOD_TYPE_IDS } from '../../common/testUtils';

const expect = chakram.expect;

const API_URI_PERIOD_TYPES = "http://localhost:8081/api/period-types";

const RESULT_ID = 'pty_id';
const RESULT_NAME = 'pty_name';

describe("ttrack API period-types", function () {
    describe("testing GET request", () => {
        it("should return 200 on success", function () {
            const response = chakram.get(API_URI_PERIOD_TYPES);
            return expect(response).to.have.status(200);
        });

        it("should not have an empty result", function () {
            const response = chakram.get(API_URI_PERIOD_TYPES);
            return expect(response).to.have.json(function (typesArray) {
                expect(typesArray).to.not.have.length(0);
            })
        });

        describe("success should return all ids", function () {
            const expectedIds = PERIOD_TYPE_IDS;

            for (let i in expectedIds) {
                let id = expectedIds[i];
                it(`and include period type id ${id}`, function () {
                    const response = chakram.get(API_URI_PERIOD_TYPES);
                    return expect(response).to.have.json(function (typesArray) {
                        const ids = typesArray.map(t => t[RESULT_ID]);
                        expect(ids.indexOf(id)).to.not.equal(-1);
                    })
                });
            }
        });

        describe("success should return all names", function () {
            const expectedNames = [
                'Arbeitszeit',
                'Ausgleich',
                'Feiertag',
                'Kommentar',
                'Krankenstand',
                'Pflegeurlaub',
                'Urlaub',
            ];

            for (let i in expectedNames) {
                let name = expectedNames[i];
                it(`and include period type id ${name}`, function () {
                    const response = chakram.get(API_URI_PERIOD_TYPES);
                    return expect(response).to.have.json(function (typesArray) {
                        const names = typesArray.map(t => t[RESULT_NAME]);
                        expect(names.indexOf(name)).to.not.equal(-1);
                    })
                });
            }
        });
    });

    describe("should only support GET calls", () => {
        it("should NOT support POST calls", () => {
            expect(chakram.post(API_URI_PERIOD_TYPES, {}, {})).to.have.status(405);
            return chakram.wait();
        });

        it("should NOT support PUT calls", () => {
            expect(chakram.put(API_URI_PERIOD_TYPES, {}, {})).to.have.status(405);
            return chakram.wait();
        });

        it("should NOT support DELETE calls", () => {
            expect(chakram.delete(API_URI_PERIOD_TYPES, {}, {})).to.have.status(405);
            return chakram.wait();
        });

        it("should NOT support PATCH calls", () => {
            expect(chakram.patch(API_URI_PERIOD_TYPES, {}, {})).to.have.status(405);
            return chakram.wait();
        });
    });
});