import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { z } from 'zod';

const authSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(8),
});

export class AuthController {
  static async signup(req: Request, res: Response) {
    try {
      const validatedData = authSchema.parse(req.body);
      const result = await AuthService.signup(validatedData);
      res.status(201).json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(400).json({ error: error.message });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const validatedData = authSchema.parse(req.body);
      const result = await AuthService.login(validatedData);
      res.json(result);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(401).json({ error: error.message });
    }
  }
}
