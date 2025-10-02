import './index.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginForm, RegisterForm } from './components/AuthForms';
import { Dashboard } from './components/Dashboard';

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Construction Workforce Hiring Platform
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Connect owners, workers, and brokers
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <section className="mb-10">
          <h2 className="text-3xl font-bold mb-3">Welcome</h2>
          <p className="text-gray-600 text-lg">
            Connect with skilled construction workers or find your next project.
            Sign in or create an account to get started.
          </p>
        </section>
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Login</h3>
            <LoginForm />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-xl font-semibold mb-4">Register</h3>
            <RegisterForm />
          </div>
        </section>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
