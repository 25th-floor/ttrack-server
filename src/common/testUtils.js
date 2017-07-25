/**
 * Test Utilities and Helpers for API Tests
 */

import pg from 'pg';
import { keys, values, range } from 'ramda';

import dbConfigFile from './../../database.json';

// Constants

export const PERIOD_TYPE_IDS = ['Balance', 'Comment', 'Holiday', 'Nursing', 'Sick', 'Vacation', 'Work'];

// Database Helper

export function getDatabasePool() {
    return new pg.Pool(dbConfigFile.test);
}

// create Entities in the Database

const createDatabaseArguments = obj => ({
    keys: keys(obj),
    placeholder: range(1, keys(obj).length + 1).map(x => `$${x}`),
    values: values(obj),
});

async function createEntity(client, table, entity) {
    const arg = createDatabaseArguments(entity);
    const cols = arg.keys.join(',');
    const pl = arg.placeholder.join(',');
    const { rows } = await client.query(`INSERT INTO ${table} (${cols}) VALUES (${pl}) RETURNING *;`, arg.values);
    return rows[0];
}

export async function createUser(client, user) {
    return await createEntity(client, 'users', user);
}

export async function createUserWithTargetTime(client, userData, targetTime, targetStart) {
    const user = await createUser(client, userData);
    const target = await createEntity(
        client,
        'user_target_times',
        {
            utt_usr_id: user.usr_id,
            utt_start: targetStart,
            utt_end: 'infinity',
            utt_target_time: targetTime,
        },
    );
    return { user, target };
}

export async function createDay(client, day) {
    return await createEntity(client, 'days', day);
}

export async function createPeriod(client, period) {
    return await createEntity(client, 'periods', period);
}

// Additional Database Calls

export async function getTargetTimeForUserAndDate(client, userId, date) {
    const { rows } = await client.query(
        'SELECT user_get_target_time FROM user_get_target_time($1, $2::DATE)',
        [userId, date],
    );
    return rows[0].user_get_target_time;
}

// Stub Create Helpers

/**
 * Helper Function to Create a period stub with a new day and everything
 *
 * @param client
 * @param userId
 * @param date
 * @returns {Promise.<*>}
 */
export async function createPeriodStubWithDayForUserAndDate(client, userId, date) {
    const target = await getTargetTimeForUserAndDate(client, userId, date);

    const dayFixture = {
        day_date: date,
        day_usr_id: userId,
        day_target_time: target,
    };
    const day = await createDay(client, dayFixture);

    // create period
    const periodFixture = {
        per_start: '08:00',
        per_day_id: day.day_id,
        per_pty_id: 'Work',
    };
    return await createPeriod(client, periodFixture);
}
