import './index.css'
import { LoginForm, RegisterForm } from './components/AuthForms'

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Construction Workforce Hiring Platform</h1>
          <nav className="space-x-4 text-sm">
            <a className="hover:underline" href="#auth">Auth</a>
            <a className="hover:underline" href="#jobs">Jobs</a>
            <a className="hover:underline" href="#dashboard">Dashboard</a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-10">
        <section id="intro" className="mb-10">
          <h2 className="text-2xl font-bold mb-2">Welcome</h2>
          <p className="text-gray-600">Connect owners, workers, and brokers with transparent brokerage management.</p>
        </section>
        <section id="auth" className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Login</h3>
            <LoginForm />
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Register</h3>
            <RegisterForm />
          </div>
        </section>
      </main>
    </div>
  )
}

export default App
