import { serialize } from 'cookie';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { password } = req.body;
  const serverPassword = process.env.ADMIN_PASSWORD;

  // Debugging logs
  console.log('Admin login attempt received.');
  console.log(`Is ADMIN_PASSWORD set on server? ${!!serverPassword}`);
  if (serverPassword) {
    console.log(`Received password length: ${password?.length || 0}`);
    console.log(`Server password length: ${serverPassword.length}`);
  }

  if (password === serverPassword) {
    console.log('Admin password match. Setting cookie.');
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
    console.log('Admin password mismatch.');
    res.status(401).json({ error: 'Invalid password' });
  }
}
