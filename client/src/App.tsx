import { useEffect, useMemo, useState } from 'react';

type Role = 'OWNER' | 'WORKER' | 'ADMIN';

type User = { id: number; email: string; name: string; role: Role };

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('user');
    return raw ? (JSON.parse(raw) as User) : null;
  });
  const headers = useMemo(() => ({ 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' }), [token]);
  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
  };
  const register = async (payload: { name: string; email: string; password: string; role: Exclude<Role, 'ADMIN'> }) => {
    const res = await fetch(`${API_URL}/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    if (!res.ok) throw new Error('Register failed');
    return await res.json();
  };
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };
  return { token, user, headers, login, logout, register };
}

function LoginRegister({ onLoggedIn }: { onLoggedIn: () => void }) {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'OWNER' as Exclude<Role, 'ADMIN'> });
  const [msg, setMsg] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isLogin) {
        await login(form.email, form.password);
        onLoggedIn();
      } else {
        const r = await register({ name: form.name, email: form.email, password: form.password, role: form.role });
        setMsg(r.message || 'Registered. Await admin approval.');
        setIsLogin(true);
      }
    } catch (e: any) {
      setMsg(e.message || 'Action failed');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
      <h1 className="text-xl font-semibold mb-4">{isLogin ? 'Login' : 'Register'}</h1>
      {msg && <div className="mb-3 text-sm text-blue-700">{msg}</div>}
      <form onSubmit={submit} className="space-y-3">
        {!isLogin && (
          <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        )}
        <input placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {!isLogin && (
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as any })}>
            <option value="OWNER">Owner</option>
            <option value="WORKER">Worker</option>
          </select>
        )}
        <div className="flex gap-2">
          <button type="submit">{isLogin ? 'Login' : 'Register'}</button>
          <button type="button" className="bg-gray-600 hover:bg-gray-700" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Need an account?' : 'Have an account?'}
          </button>
        </div>
      </form>
    </div>
  );
}

function OwnerDashboard({ token, headers, logout }: { token: string; headers: HeadersInit; logout: () => void }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [form, setForm] = useState({ title: '', description: '' });
  const load = async () => {
    const res = await fetch(`${API_URL}/projects/mine`, { headers });
    if (res.ok) setProjects(await res.json());
  };
  useEffect(() => { load(); }, [token]);
  const createProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`${API_URL}/projects`, { method: 'POST', headers, body: JSON.stringify(form) });
    if (res.ok) {
      setForm({ title: '', description: '' });
      load();
    }
  };
  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between mb-4"><h2 className="text-xl font-semibold">My Projects</h2><button onClick={logout}>Logout</button></div>
      <form onSubmit={createProject} className="flex gap-2 mb-4">
        <input placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <button type="submit">Add</button>
      </form>
      <table className="table">
        <thead><tr><th>ID</th><th>Title</th><th>Status</th><th>Assigned Workers</th></tr></thead>
        <tbody>
          {projects.map((p) => (
            <tr key={p.id}><td>{p.id}</td><td>{p.title}</td><td>{p.status}</td><td>{(p.assignments||[]).map((a:any)=>a.worker?.name).join(', ')}</td></tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function WorkerDashboard({ token, headers, logout }: { token: string; headers: HeadersInit; logout: () => void }) {
  const [openProjects, setOpenProjects] = useState<any[]>([]);
  const [profile, setProfile] = useState<any | null>(null);
  const [assigned, setAssigned] = useState<any[]>([]);
  const load = async () => {
    const [pRes, prRes, aRes] = await Promise.all([
      fetch(`${API_URL}/projects`, { headers }),
      fetch(`${API_URL}/workers/me`, { headers }),
      fetch(`${API_URL}/projects/assigned`, { headers }),
    ]);
    if (pRes.ok) setOpenProjects(await pRes.json());
    if (prRes.ok) setProfile(await prRes.json());
    if (aRes.ok) setAssigned(await aRes.json());
  };
  useEffect(() => { load(); }, [token]);
  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_URL}/workers/me`, { method: 'PUT', headers, body: JSON.stringify({ skills: profile?.skills || '', bio: profile?.bio || '' }) });
    load();
  };
  const apply = async (id: number) => {
    await fetch(`${API_URL}/projects/${id}/apply`, { method: 'POST', headers, body: JSON.stringify({}) });
    alert('Applied');
  };
  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex justify-between mb-4"><h2 className="text-xl font-semibold">Worker Dashboard</h2><button onClick={logout}>Logout</button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">My Profile</h3>
          {profile && (
            <form onSubmit={saveProfile} className="space-y-2">
              <input placeholder="Skills (comma separated)" value={profile.skills || ''} onChange={(e) => setProfile({ ...profile, skills: e.target.value })} />
              <textarea placeholder="Bio" value={profile.bio || ''} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
              <button type="submit">Save</button>
            </form>
          )}
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Assigned Projects</h3>
          <ul className="list-disc pl-5 text-sm">
            {assigned.map((a) => (
              <li key={a.id}>#{a.projectId} - {a.project?.title}</li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-6 bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Open Projects</h3>
        <table className="table"><thead><tr><th>ID</th><th>Title</th><th></th></tr></thead><tbody>
          {openProjects.map((p) => (
            <tr key={p.id}><td>{p.id}</td><td>{p.title}</td><td><button onClick={() => apply(p.id)}>Apply</button></td></tr>
          ))}
        </tbody></table>
      </div>
    </div>
  );
}

function AdminDashboard({ headers, logout }: { headers: HeadersInit; logout: () => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [ownerProjects, setOwnerProjects] = useState<any[]>([]);
  const [assignForm, setAssignForm] = useState({ projectId: '', workerId: '' });
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'OWNER', skills: '' });
  const load = async () => {
    const u = await fetch(`${API_URL}/admin/users`, { headers });
    if (u.ok) setUsers(await u.json());
    // Get all open projects for assigning
    const p = await fetch(`${API_URL}/projects`, { headers });
    if (p.ok) setOwnerProjects(await p.json());
  };
  useEffect(() => { load(); }, []);
  const setApproved = async (id: number, approved: boolean) => {
    await fetch(`${API_URL}/admin/users/${id}/approve`, { method: 'PUT', headers, body: JSON.stringify({ approved }) });
    load();
  };
  const assign = async (e: React.FormEvent) => {
    e.preventDefault();
    const pid = Number(assignForm.projectId); const wid = Number(assignForm.workerId);
    if (!pid || !wid) return;
    await fetch(`${API_URL}/admin/projects/${pid}/assign`, { method: 'POST', headers, body: JSON.stringify({ workerId: wid }) });
    setAssignForm({ projectId: '', workerId: '' });
    load();
  };
  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch(`${API_URL}/admin/users`, { method: 'POST', headers, body: JSON.stringify({ ...createForm, approved: true }) });
    setCreateForm({ name: '', email: '', password: '', role: 'OWNER', skills: '' });
    load();
  };
  return (
    <div className="p-4 max-w-6xl mx-auto">
      <div className="flex justify-between mb-4"><h2 className="text-xl font-semibold">Admin Dashboard</h2><button onClick={logout}>Logout</button></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Users</h3>
          <table className="table"><thead><tr><th>ID</th><th>Name</th><th>Role</th><th>Approved</th><th></th></tr></thead><tbody>
            {users.map((u) => (
              <tr key={u.id}><td>{u.id}</td><td>{u.name}</td><td>{u.role}</td><td>{String(u.approved)}</td>
                <td>
                  <button className="mr-2" onClick={() => setApproved(u.id, true)}>Approve</button>
                  <button className="bg-gray-600 hover:bg-gray-700" onClick={() => setApproved(u.id, false)}>Reject</button>
                </td></tr>
            ))}
          </tbody></table>
        </div>
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold mb-2">Assign Worker</h3>
          <form onSubmit={assign} className="flex gap-2">
            <input placeholder="Project ID" value={assignForm.projectId} onChange={(e) => setAssignForm({ ...assignForm, projectId: e.target.value })} />
            <input placeholder="Worker ID" value={assignForm.workerId} onChange={(e) => setAssignForm({ ...assignForm, workerId: e.target.value })} />
            <button type="submit">Assign</button>
          </form>
        </div>
        <div className="bg-white p-4 rounded shadow md:col-span-2">
          <h3 className="font-semibold mb-2">Create User</h3>
          <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-5 gap-2">
            <input placeholder="Name" value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
            <input placeholder="Email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
            <input placeholder="Password" type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
            <select value={createForm.role} onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}>
              <option value="OWNER">Owner</option>
              <option value="WORKER">Worker</option>
            </select>
            <input placeholder="Skills (workers only)" value={createForm.skills} onChange={(e) => setCreateForm({ ...createForm, skills: e.target.value })} />
            <button type="submit" className="md:col-span-5">Create</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { token, user, headers, logout } = useAuth();
  const [ready, setReady] = useState(false);
  useEffect(() => { setReady(true); }, []);
  if (!ready) return null;
  if (!token || !user) return <LoginRegister onLoggedIn={() => setReady((r) => r)} />;
  if (user.role === 'OWNER') return <OwnerDashboard token={token} headers={headers} logout={logout} />;
  if (user.role === 'WORKER') return <WorkerDashboard token={token} headers={headers} logout={logout} />;
  return <AdminDashboard headers={headers} logout={logout} />;
}

export default App;
