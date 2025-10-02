import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { authHeaders } from '../lib/auth';
import { useAuth } from '../contexts/AuthContext';

type Job = {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  budget: number | null;
  status: string;
  createdAt: string;
  ownerId: string;
};

type Application = {
  id: string;
  coverNote: string | null;
  status: string;
  createdAt: string;
  worker: { id: string; fullName: string; email: string };
};

type Message = {
  id: string;
  content: string;
  createdAt: string;
  sender: { id: string; fullName: string };
};

type JobDetailsProps = {
  jobId: string;
  onBack: () => void;
};

export function JobDetails({ jobId, onBack }: JobDetailsProps) {
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'applications' | 'messages'>('details');
  const [newMessage, setNewMessage] = useState('');
  const [coverNote, setCoverNote] = useState('');
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    loadJobDetails();
  }, [jobId]);

  async function loadJobDetails() {
    try {
      setLoading(true);
      const jobData = await api<Job>(`/jobs/${jobId}`, { headers: authHeaders() });
      setJob(jobData);

      if (user?.role === 'OWNER' && jobData.ownerId === user.id) {
        const appsData = await api<{ items: Application[] }>(`/applications?jobId=${jobId}`, {
          headers: authHeaders(),
        });
        setApplications(appsData.items);
      }

      if (user?.role === 'WORKER') {
        const appsData = await api<{ items: Application[] }>(`/applications?jobId=${jobId}`, {
          headers: authHeaders(),
        });
        setHasApplied(appsData.items.some(app => app.worker.id === user.id));
      }

      const msgsData = await api<{ items: Message[] }>(`/messages?jobId=${jobId}`, {
        headers: authHeaders(),
      });
      setMessages(msgsData.items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    try {
      await api('/applications', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ jobId, coverNote }),
      });
      setHasApplied(true);
      setCoverNote('');
      alert('Application submitted successfully!');
    } catch (err: any) {
      alert(err.message);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await api('/messages', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ jobId, content: newMessage }),
      });
      setNewMessage('');
      loadJobDetails();
    } catch (err: any) {
      alert(err.message);
    }
  }

  if (loading) return <div className="text-center py-8">Loading...</div>;
  if (error || !job) return <div className="text-red-600 py-8">Error loading job details</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="text-blue-600 hover:underline flex items-center gap-2"
      >
        ← Back to jobs
      </button>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
              <span>Category: {job.category}</span>
              <span>Location: {job.location}</span>
              {job.budget && <span>Budget: ${job.budget.toLocaleString()}</span>}
            </div>
          </div>
          <span className="px-3 py-1 text-sm font-medium bg-green-100 text-green-800 rounded-full">
            {job.status}
          </span>
        </div>
      </div>

      <div className="border-b">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('details')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Details
          </button>
          {user?.role === 'OWNER' && job.ownerId === user.id && (
            <button
              onClick={() => setActiveTab('applications')}
              className={`pb-3 border-b-2 transition-colors ${
                activeTab === 'applications'
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Applications ({applications.length})
            </button>
          )}
          <button
            onClick={() => setActiveTab('messages')}
            className={`pb-3 border-b-2 transition-colors ${
              activeTab === 'messages'
                ? 'border-blue-600 text-blue-600 font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Messages ({messages.length})
          </button>
        </nav>
      </div>

      {activeTab === 'details' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-3">Description</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{job.description}</p>
          </div>

          {user?.role === 'WORKER' && !hasApplied && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Apply for this job</h2>
              <form onSubmit={handleApply} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cover Note (optional)
                  </label>
                  <textarea
                    rows={4}
                    className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell the owner why you're a good fit for this job..."
                    value={coverNote}
                    onChange={(e) => setCoverNote(e.target.value)}
                  />
                </div>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Submit Application
                </button>
              </form>
            </div>
          )}

          {hasApplied && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              You have already applied to this job.
            </div>
          )}
        </div>
      )}

      {activeTab === 'applications' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Applications</h2>
          {applications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No applications yet</p>
          ) : (
            <div className="space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{app.worker.fullName}</h3>
                      <p className="text-sm text-gray-600">{app.worker.email}</p>
                    </div>
                    <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {app.status}
                    </span>
                  </div>
                  {app.coverNote && (
                    <p className="mt-3 text-gray-700 text-sm">{app.coverNote}</p>
                  )}
                  <p className="mt-2 text-xs text-gray-500">
                    Applied {new Date(app.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Messages</h2>
          <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
            {messages.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No messages yet</p>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg ${
                    msg.sender.id === user?.id ? 'bg-blue-50 ml-12' : 'bg-gray-50 mr-12'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-medium text-sm">{msg.sender.fullName}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(msg.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-gray-700">{msg.content}</p>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input
              type="text"
              className="flex-1 border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
