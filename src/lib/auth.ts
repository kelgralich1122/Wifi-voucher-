import { jwtVerify, SignJWT } from 'jose';
import { cookies } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'dev-secret-key');

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
}

interface Session {
  user: User;
}

export async function login(user: User) {
  const token = await new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('7d')
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set('session', token, { httpOnly: true, secure: false, maxAge: 60 * 60 * 24 * 7 });
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function getSession(): Promise<Session | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return null;

    const verified = await jwtVerify(token, secret);
    return verified.payload as Session;
  } catch (err) {
    return null;
  }
}