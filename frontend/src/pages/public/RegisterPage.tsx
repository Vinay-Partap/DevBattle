import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Terminal, User, Mail, Building2, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { mockColleges } from '../../data/mockData';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { registerUser } = useAuth();
  const [role, setRole] = useState<'student' | 'mentor'>('student');
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    collegeId: mockColleges[0]?.id || '',
    branchName: 'Computer Science & Engineering',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const selectedCollege = mockColleges.find(c => c.id === formData.collegeId);
    
    // Register the user in the pending queue
    registerUser({
      name: formData.name,
      email: formData.email,
      password: formData.password,
      role: role,
      collegeId: formData.collegeId,
      collegeName: selectedCollege?.name || 'Unknown College',
      branchName: formData.branchName,
    });

    setSubmitted(true);
    addToast('info', 'Registration Submitted', 'Your account application has been routed to Admin Approval Queue.');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-indigo-600 via-cyan-500 to-emerald-400 text-white w-fit mx-auto shadow-lg shadow-indigo-500/20">
            <Terminal className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white">Join DevBattles</h1>
          <p className="text-xs text-slate-400">Register as Student or Mentor for your college</p>
        </div>

        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h2 className="text-xl font-bold text-white">Registration Application Submitted!</h2>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Per strict security protocol, every account application is verified by the Super Admin before activation.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Button variant="glow" size="sm" onClick={() => navigate('/login')}>
                Go to Sign In
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/approvals')}>
                View Admin Queue (Demo)
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Applying As</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('student')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    role === 'student' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  🎓 Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('mentor')}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    role === 'mentor' ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  👨‍🏫 Mentor / Faculty
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Rohan Mehta"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">College Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="rohan@krmangalam.edu.in"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Select College</label>
                <select
                  name="collegeId"
                  value={formData.collegeId}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  {mockColleges.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Branch / Department</label>
                <select
                  name="branchName"
                  value={formData.branchName}
                  onChange={handleChange}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                >
                  <option>Computer Science & Engineering</option>
                  <option>AI & Data Science</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Password</label>
              <input
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <Button type="submit" variant="glow" className="w-full">
              Submit Registration for Admin Approval
            </Button>
          </form>
        )}

        <div className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-400 font-bold hover:underline">
            Sign In
          </Link>
        </div>
      </Card>
    </div>
  );
};
