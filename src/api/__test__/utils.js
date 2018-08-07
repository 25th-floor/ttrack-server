import axios from 'axios';

export const testServer = axios.create({
    baseURL: `${process.Server.info.uri}`,
    headers: {},
    timeout: 5000,
});

export default testServer;
