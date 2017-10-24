import {getValidDateRange} from '../dateUtils';

describe('ttrack dateUtils', () => {
    describe('getValidDateRange', () => {
        describe('returns null if out of range', () => {
            it('will return null if range is before users start', () => {
                expect(getValidDateRange('2017-01-01', null, {start: '2001-01-01', end: '2001-01-02'})).toBe(null);
            });

            it('will return null if range is after users end', () => {
                expect(getValidDateRange('2017-01-01', '2017-02-01', {start: '2018-01-01', end: '2018-01-02'})).toBe(null);
            });
        });

        describe('returns dateRange with no changes', () => {
            it('will return range if range is between users start and end', () => {
                const dateRange = {start: '2017-01-02', end: '2017-01-04'};
                expect(getValidDateRange('2017-01-01', '2017-02-01', dateRange)).toBe(dateRange);
            });

            it('will return range if range is start is after users start and user has no end', () => {
                const dateRange = {start: '2017-01-02', end: '2017-01-04'};
                expect(getValidDateRange('2017-01-01', null, dateRange)).toBe(dateRange);
            });
        });

        describe('returns new Range (smaller) because it hits a barrier', () => {
            it('will return new range if range starts before users start and user has no end', () => {
                const dateRange = {start: '2016-12-01', end: '2017-02-01'};
                expect(getValidDateRange('2017-01-01', null, dateRange))
                    .toMatchObject({start: '2017-01-01', end: '2017-02-01'});
            });

            it('will return new range if range starts before users start and ends between users start and end', () => {
                const dateRange = {start: '2016-12-01', end: '2017-02-01'};
                expect(getValidDateRange('2017-01-01', '2017-03-01', dateRange))
                    .toMatchObject({start: '2017-01-01', end: '2017-02-01'});
            });

            it('will return new range if range starts between users start and end but ends after users end', () => {
                const dateRange = {start: '2017-01-11', end: '2017-03-01'};
                expect(getValidDateRange('2017-01-01', '2017-02-01', dateRange))
                    .toMatchObject({start: '2017-01-11', end: '2017-02-01'});
            });
        });
    });

});