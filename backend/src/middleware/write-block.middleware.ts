import { Request, Response, NextFunction } from 'express';
import { isDbBlocked } from '../utils/db-utils';

export const writeBlockMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const method = req.method.toUpperCase();
    if (isDbBlocked() && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        return res.status(503).json({ error: 'Service temporarily unavailable - DB writes are currently blocked' });
    }
    next();
};

export default writeBlockMiddleware;
