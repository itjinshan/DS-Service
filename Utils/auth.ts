import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const authToken = req.body?.token;
    if (!authToken) {
        res.status(401).send("Unauthorized");
        return;
    }

    jwt.verify(authToken, process.env.DEEPSEEK_JWT_SECRET as string, (err: jwt.VerifyErrors | null) => {
        if (err) {
            res.status(401).send("Unauthorized");
            return;
        }
        next();
    });
}
