import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { JobsList } from './JobsList';
import { CreateJob } from './CreateJob';
import { JobDetails } from './JobDetails';

export function Dashboard() {
  const { user, logout } = useAuth();
  const [view, setView] = useState<'list' | 'create' | 'details'>('list');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  function handleCreateJob() {
    setView('create');
  }

  function handleJobCreated() {
    setView('list');
  }

  function handleSelectJob(jobId: string) {
    setSelectedJobId(jobId);
    setView('details');
  }

  function handleBackToList() {
    setView('list');
    setSelectedJobId(null);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Construction Workforce Platform
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Welcome back, {user?.fullName} ({user?.role})
              </p>
            </div>
            <div className="flex items-center gap-4">
              {user?.role === 'OWNER' && view === 'list' && (
                <button
                  onClick={handleCreateJob}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Post New Job
                </button>
              )}
              <button
                onClick={logout}
                className="text-gray-600 hover:text-gray-900 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {view === 'list' && <JobsList onSelectJob={handleSelectJob} />}
        {view === 'create' && (
          <CreateJob onJobCreated={handleJobCreated} onCancel={handleBackToList} />
        )}
        {view === 'details' && selectedJobId && (
          <JobDetails jobId={selectedJobId} onBack={handleBackToList} />
        )}
      </main>
    </div>
  );
}
