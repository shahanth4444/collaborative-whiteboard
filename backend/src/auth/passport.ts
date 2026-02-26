import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { pool } from '../db';

export function configurePassport() {
    passport.use(
        new GoogleStrategy(
            {
                clientID: process.env.GOOGLE_CLIENT_ID || '',
                clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
                callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:3001/api/auth/google/callback',
            },
            async (_accessToken, _refreshToken, profile, done) => {
                try {
                    const email = profile.emails?.[0]?.value || '';
                    const name = profile.displayName || '';
                    const image = profile.photos?.[0]?.value || '';
                    const googleId = profile.id;

                    const result = await pool.query(
                        `INSERT INTO users (google_id, name, email, image)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (google_id) DO UPDATE
             SET name = EXCLUDED.name, image = EXCLUDED.image, updated_at = NOW()
             RETURNING *`,
                        [googleId, name, email, image]
                    );

                    return done(null, result.rows[0]);
                } catch (err) {
                    return done(err as Error);
                }
            }
        )
    );

    passport.serializeUser((user: Express.User, done) => {
        const u = user as { id: string };
        done(null, u.id);
    });

    passport.deserializeUser(async (id: string, done) => {
        try {
            const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
            if (result.rows.length === 0) {
                return done(null, false);
            }
            done(null, result.rows[0]);
        } catch (err) {
            done(err);
        }
    });
}
