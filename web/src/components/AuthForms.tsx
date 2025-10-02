import { useState } from 'react';
import { api } from '../lib/api';

type LoginResponse = { user: { id: string; email: string; fullName: string; role: string }; token: string };

type RegisterResponse = LoginResponse;

export function LoginForm() {
  const [email, setEmail] = useState('owner@example.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const data = await api<LoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('token', data.token);
      alert(`Welcome ${data.user.fullName}`);
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input className="w-full border rounded px-3 py-2" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button className="bg-blue-600 text-white px-4 py-2 rounded">Login</button>
    </form>
  );
}

export function RegisterForm() {
  const [form, setForm] = useState({ email: '', password: '', fullName: '', role: 'WORKER', phone: '' });
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const data = await api<RegisterResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      localStorage.setItem('token', data.token);
      alert(`Registered ${data.user.fullName}`);
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <input className="w-full border rounded px-3 py-2" placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
      <input className="w-full border rounded px-3 py-2" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input className="w-full border rounded px-3 py-2" placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
      <select className="w-full border rounded px-3 py-2" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
        <option value="OWNER">Owner</option>
        <option value="WORKER">Worker</option>
        <option value="BROKER">Broker</option>
      </select>
      <input className="w-full border rounded px-3 py-2" placeholder="Phone (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <button className="bg-green-600 text-white px-4 py-2 rounded">Register</button>
    </form>
  );
}
