import { serialize } from 'cookie';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { password } = req.body;

  if (password === process.env.ADMIN_PASSWORD) {
    const cookie = serialize('admin-pass', password, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'development',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
    });
    res.setHeader('Set-Cookie', cookie);
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
}
