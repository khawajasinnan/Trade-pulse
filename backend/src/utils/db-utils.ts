import NodeCache from 'node-cache';

const dbCache = new NodeCache({ stdTTL: 0, checkperiod: 60 });

export const blockDbWrites = (seconds = 30) => {
    dbCache.set('db_write_blocked', true, seconds);
};

export const unblockDbWrites = () => {
    dbCache.del('db_write_blocked');
};

export const isDbBlocked = (): boolean => {
    return !!dbCache.get('db_write_blocked');
};

export default {
    blockDbWrites,
    unblockDbWrites,
    isDbBlocked,
};
