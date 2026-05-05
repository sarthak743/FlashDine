import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const router = Router();

// Default hashed password for "admin123" — always override via ADMIN_PASSWORD_HASH env var.
// Generate your own: node -e "require('bcryptjs').hash('yourpassword',12).then(console.log)"
const DEFAULT_HASH = '$2b$12$tLGQTao2RVkDuRhjc1Ba/uPUmYHU5wP3/0h7qI4JSC2VgL2qbpGme'; // admin123

if (!process.env.ADMIN_PASSWORD_HASH) {
  console.warn('[auth] WARNING: ADMIN_PASSWORD_HASH not set — using default demo password. Set ADMIN_PASSWORD_HASH before going to production.');
}

const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || DEFAULT_HASH;

const loginSchema = z.object({
  password: z.string().min(1),
});

/**
 * POST /api/auth/login
 * Body: { password: string }
 * Returns: { success: boolean }
 */
router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Password is required' });
    return;
  }

  const { password } = parsed.data;

  let valid = false;
  try {
    valid = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
  } catch {
    res.status(500).json({ error: 'Authentication error' });
    return;
  }

  if (!valid) {
    // Constant-time comparison already done by bcrypt; just return generic error.
    res.status(401).json({ error: 'Invalid password' });
    return;
  }

  res.json({ success: true });
});

export default router;
