import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export const authenticateToken = (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  jwt.verify(token, config.jwtSecret, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

export const checkRole = (roles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    if (!req.user) return res.sendStatus(401);
    if (!roles.includes(req.user.role)) return res.sendStatus(403);
    next();
  };
};
