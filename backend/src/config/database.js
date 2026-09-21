import * as jsonDb from '../db/index.js';

export const getPool = () => {
  throw new Error('Direct SQL pool is disabled. Use repository functions from db/index.js');
};

export const withTransaction = jsonDb.withTransaction;

export { jsonDb };
