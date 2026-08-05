import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Terminal, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { register } = useAuth();
  const { colleges } = useData();

  const [role, setRole] = useState<'student' | 'mentor'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [collegeId, setCollegeId] = useState(colleges[0]?.id ?? '');
  const [branchName, setBranchName] = useState('');
  const [batchName, setBatchName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const selectedCollege = useMemo(() => colleges.find((c) => c.id === collegeId), [colleges, collegeId]);
  const branches = selectedCollege?.branches ?? [];
  const batches = branches.find((b) => b.name === branchName)?.batches ?? [];

  const handleCollegeChange = (value: string) => {
    setCollegeId(value);
    setBranchName('');
    setBatchName('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    const result = await register({
      name,
      email,
      password,
      role,
      collegeId,
      branchName: branchName || branches[0]?.name,
      batchName: batchName || undefined,
    });

    if (!result.ok) {
      setError(result.error ?? 'Registration failed. Please try again.');
      addToast('error', 'Registration Failed', result.error);
      return;
    }

    setSubmitted(true);
    addToast('info', 'Registration Submitted', 'Your application has been routed to the Super Admin approval queue.');
  };

  const inputClass =
    'w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500';

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
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Per strict security protocol, every account application is verified by the Super Admin before activation.
              Once approved, sign in with <strong className="text-slate-200">{email.toLowerCase()}</strong> and the
              password you just created.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <Button variant="glow" size="sm" onClick={() => navigate('/login')}>
                Go to Sign In
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
                <label htmlFor="reg-name" className="block text-xs font-bold text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  id="reg-name"
                  type="text"
                  required
                  placeholder="Rohan Mehta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="reg-email" className="block text-xs font-bold text-slate-300 mb-1">
                  College Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  required
                  placeholder="rohan@krmangalam.edu.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-college" className="block text-xs font-bold text-slate-300 mb-1">
                  Select College
                </label>
                <select
                  id="reg-college"
                  required
                  value={collegeId}
                  onChange={(e) => handleCollegeChange(e.target.value)}
                  className={inputClass}
                >
                  <option value="" disabled>
                    Choose your campus
                  </option>
                  {colleges.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="reg-branch" className="block text-xs font-bold text-slate-300 mb-1">
                  Branch / Department
                </label>
                <select
                  id="reg-branch"
                  value={branchName}
                  onChange={(e) => {
                    setBranchName(e.target.value);
                    setBatchName('');
                  }}
                  className={inputClass}
                  disabled={branches.length === 0}
                >
                  <option value="">{branches.length ? 'Select branch' : 'No branches configured yet'}</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {batches.length > 0 && (
              <div>
                <label htmlFor="reg-batch" className="block text-xs font-bold text-slate-300 mb-1">
                  Batch / Section
                </label>
                <select id="reg-batch" value={batchName} onChange={(e) => setBatchName(e.target.value)} className={inputClass}>
                  <option value="">Select batch (optional)</option>
                  {batches.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="reg-password" className="block text-xs font-bold text-slate-300 mb-1">
                  Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  required
                  minLength={8}
                  placeholder="8+ chars, upper/lower/number/symbol"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="reg-confirm" className="block text-xs font-bold text-slate-300 mb-1">
                  Confirm Password
                </label>
                <input
                  id="reg-confirm"
                  type="password"
                  required
                  minLength={8}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-[11px] text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-px" />
                <span>{error}</span>
              </div>
            )}

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
