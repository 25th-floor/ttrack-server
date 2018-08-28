import axios from 'axios';
import pg from 'pg';

const URI = 'http://0.0.0.0:8001';

export const testServer = axios.create({
    baseURL: URI,
    headers: {},
    timeout: 5000,
});

export const createDatabaseConnection = async () => {
    const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@postgres:5432/ttrack_test';
    console.log(`✅  Database is Configured on ${connectionString}`);

    const pool = new pg.Pool({connectionString: connectionString});
    const client = await pool.connect();
    return client;
};

export default testServer;
