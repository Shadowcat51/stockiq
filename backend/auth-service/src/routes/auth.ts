import { Router } from 'express';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { pool } from '../db';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, generateRandomToken } from '../utils/token';
import { sendVerificationEmail, sendPasswordResetEmail } from '../services/email.service';
import { google } from 'googleapis';

const router = Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    // Check if user exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const newUserResult = await pool.query(
      'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id',
      [email, passwordHash, name]
    );
    const userId = newUserResult.rows[0].id;

    // Generate verification token
    const token = generateRandomToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

    await pool.query(
      'INSERT INTO verification_tokens (user_id, token, type, expires_at) VALUES ($1, $2, $3, $4)',
      [userId, token, 'email_verification', expiresAt]
    );

    // Send verification email
    await sendVerificationEmail(email, token, name);

    return res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
    }
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// VERIFY EMAIL
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Check token
    const tokenResult = await pool.query(
      "SELECT user_id, expires_at FROM verification_tokens WHERE token = $1 AND type = 'email_verification'",
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid token' });
    }

    const { user_id, expires_at } = tokenResult.rows[0];

    if (new Date() > new Date(expires_at)) {
      return res.status(400).json({ message: 'Token has expired' });
    }

    // Update user
    await pool.query('UPDATE users SET is_verified = true WHERE id = $1', [user_id]);

    // Delete used token
    await pool.query('DELETE FROM verification_tokens WHERE token = $1', [token]);

    return res.status(200).json({ message: 'Email successfully verified' });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const userResult = await pool.query('SELECT id, password_hash, name, is_verified FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = userResult.rows[0];

    // OAuth users might not have a password
    if (!user.password_hash) {
      return res.status(401).json({ message: 'Please login using Google' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.is_verified) {
      return res.status(403).json({ message: 'Please verify your email before logging in' });
    }

    const tokenPayload = { userId: user.id, email };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token to DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    // Set HTTP-Only Cookie for Refresh Token (7 days)
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: { id: user.id, name: user.name, email },
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input data', errors: error.errors });
    }
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// REFRESH TOKEN
router.post('/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token provided' });
    }

    // Check if token exists in DB and is not revoked
    const dbToken = await pool.query(
      'SELECT user_id FROM refresh_tokens WHERE token = $1 AND is_revoked = false AND expires_at > NOW()',
      [refreshToken]
    );

    if (dbToken.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid or expired refresh token' });
    }

    // Verify token signature
    const decoded = verifyRefreshToken(refreshToken);
    const userId = dbToken.rows[0].user_id;

    if (decoded.userId !== userId) {
      return res.status(401).json({ message: 'Token mismatch' });
    }

    const userResult = await pool.query('SELECT email, name FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newAccessToken = generateAccessToken({ userId, email: userResult.rows[0].email });

    return res.status(200).json({
      accessToken: newAccessToken,
      user: { id: userId, email: userResult.rows[0].email, name: userResult.rows[0].name }
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(401).json({ message: 'Invalid refresh token' });
  }
});

// LOGOUT
router.post('/logout', async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    
    if (refreshToken) {
      // Revoke token in DB
      await pool.query('UPDATE refresh_tokens SET is_revoked = true WHERE token = $1', [refreshToken]);
    }

    // Clear cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// FORGOT PASSWORD
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);

    const userResult = await pool.query('SELECT id, name, is_verified FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: 'Email tidak ditemukan di sistem kami' });
    }

    const user = userResult.rows[0];

    if (!user.is_verified) {
      return res.status(400).json({ message: 'Akun belum diverifikasi. Silakan verifikasi email Anda terlebih dahulu.' });
    }

    // Check if an active token already exists
    const existingToken = await pool.query(
      "SELECT token FROM verification_tokens WHERE user_id = $1 AND type = 'password_reset' AND expires_at > NOW()",
      [user.id]
    );

    if (existingToken.rows.length > 0) {
      return res.status(400).json({ message: 'Link reset password sudah dikirim sebelumnya dan masih aktif. Silakan cek email Anda.' });
    }

    const token = generateRandomToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry for reset password

    await pool.query(
      'INSERT INTO verification_tokens (user_id, token, type, expires_at) VALUES ($1, $2, $3, $4)',
      [user.id, token, 'password_reset', expiresAt]
    );

    await sendPasswordResetEmail(email, token, user.name);

    return res.status(200).json({ message: 'Link reset password berhasil dikirim ke email Anda.' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid email format' });
    }
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// RESET PASSWORD
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = z.object({
      token: z.string(),
      password: z.string().min(8),
    }).parse(req.body);

    const tokenResult = await pool.query(
      "SELECT user_id, expires_at FROM verification_tokens WHERE token = $1 AND type = 'password_reset'",
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ message: 'Token reset password tidak valid.' });
    }

    const { user_id, expires_at } = tokenResult.rows[0];

    if (new Date() > new Date(expires_at)) {
      return res.status(400).json({ message: 'Token reset password sudah kedaluwarsa.' });
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, user_id]);
    await pool.query('DELETE FROM verification_tokens WHERE token = $1', [token]);

    return res.status(200).json({ message: 'Password berhasil direset.' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid input data' });
    }
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


// GOOGLE OAUTH
router.get('/google', (req, res) => {
  const { action } = req.query;
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    state: (action as string) || 'login',
  });
  res.redirect(url);
});

router.get('/google/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code || typeof code !== 'string') {
      return res.status(400).send('Invalid code');
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ auth: oauth2Client, version: 'v2' });
    const { data } = await oauth2.userinfo.get();
    
    if (!data.email) {
      return res.status(400).send('No email returned from Google');
    }

    // Check if user exists
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [data.email]);
    let user;

    if (existingUser.rows.length === 0) {
      if (state === 'login') {
        // User attempted to login but account does not exist
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=account_not_found`);
      }

      // Register new user, initially UNVERIFIED
      const newUserResult = await pool.query(
        'INSERT INTO users (email, name, google_id, is_verified, avatar_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [data.email, data.name, data.id, false, data.picture]
      );
      user = newUserResult.rows[0];

      // Generate verification token and send email
      const token = generateRandomToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiry

      await pool.query(
        'INSERT INTO verification_tokens (user_id, token, type, expires_at) VALUES ($1, $2, $3, $4)',
        [user.id, token, 'email_verification', expiresAt]
      );

      await sendVerificationEmail(data.email, token, data.name);

      // Redirect to login to ask for verification
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?message=check_email`);
    } else {
      if (state === 'register') {
        // User attempted to register but account already exists
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=account_exists`);
      }

      user = existingUser.rows[0];
      // Update google_id if missing
      if (!user.google_id) {
        await pool.query('UPDATE users SET google_id = $1 WHERE id = $2', [data.id, user.id]);
      }

      // If user is still not verified, block login and redirect to login page with error
      if (!user.is_verified) {
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=not_verified`);
      }
    }

    const tokenPayload = { userId: user.id, email: user.email };
    const refreshToken = generateRefreshToken(tokenPayload);

    // Save refresh token to DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    // Set HTTP-Only Cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Generate short-lived accessToken to send in URL hash for immediate client use
    const accessToken = generateAccessToken(tokenPayload);
    const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
    redirectUrl.pathname = '/dashboard';
    
    // Pass user info via URL hash (so it's not in the server logs)
    const hashData = encodeURIComponent(JSON.stringify({ 
      accessToken, 
      user: { id: user.id, name: user.name, email: user.email } 
    }));
    redirectUrl.hash = hashData;

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('Google OAuth error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=oauth_failed`);
  }
});

export default router;
