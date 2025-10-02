import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { authHeaders } from '../lib/auth';

type Job = {
  id: string;
  title: string;
  description: string;
  location: string;
  category: string;
  budget: number | null;
  status: string;
  createdAt: string;
  owner: { id: string; fullName: string };
};

type JobsListProps = {
  onSelectJob: (jobId: string) => void;
};

export function JobsList({ onSelectJob }: JobsListProps) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  async function loadJobs() {
    try {
      setLoading(true);
      const data = await api<{ items: Job[] }>('/jobs', {
        headers: authHeaders(),
      });
      setJobs(data.items);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <div className="text-center py-8">Loading jobs...</div>;
  if (error) return <div className="text-red-600 py-8">Error: {error}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Available Jobs</h2>
        <button
          onClick={loadJobs}
          className="text-sm text-blue-600 hover:underline"
        >
          Refresh
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No jobs available yet. Check back soon!
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white border rounded-lg p-5 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onSelectJob(job.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Posted by {job.owner.fullName}
                  </p>
                </div>
                <span className="px-3 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  {job.status}
                </span>
              </div>

              <p className="text-gray-700 mt-3 line-clamp-2">{job.description}</p>

              <div className="flex items-center gap-4 mt-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span className="font-medium">Category:</span> {job.category}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">Location:</span> {job.location}
                </span>
                {job.budget && (
                  <span className="flex items-center gap-1">
                    <span className="font-medium">Budget:</span> ${job.budget.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
