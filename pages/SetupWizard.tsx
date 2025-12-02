import React, { useState } from 'react';
import { GlassCard, GlassButton, GlassInput } from '../components/GlassUI';
import { Building2, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

const SetupWizard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
      schoolName: '',
      email: '',
      password: ''
  });

  const handleRegister = async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);

      const res = await api.registerSchool(formData.schoolName, formData.email, formData.password);
      
      setLoading(false);
      if (res.success) {
          alert("Registration Successful! Please login.");
          navigate('/login');
      } else {
          alert("Registration Failed: " + res.message);
      }
  };

  return (
    <div className="flex items-center justify-center p-4 py-12">
      <GlassCard className="max-w-md w-full shadow-xl border-slate-200 dark:border-slate-700">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Register Your School</h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
                Create your result portal in seconds. No credit card required.
            </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-5">
            <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">School Name</label>
                <GlassInput 
                    placeholder="e.g. Govt HSS Trivandrum"
                    value={formData.schoolName}
                    onChange={(e) => setFormData({...formData, schoolName: e.target.value})}
                    required
                />
            </div>
            <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Admin Email</label>
                <GlassInput 
                    type="email"
                    placeholder="admin@school.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                />
            </div>
            <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 block mb-1">Create Password</label>
                <GlassInput 
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    minLength={6}
                />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-300 flex gap-2 items-start">
                <CheckCircle className="w-5 h-5 shrink-0 text-blue-600 dark:text-blue-400" />
                <p>You will get a Free Tier license automatically. You can upgrade to Pro later from the dashboard.</p>
            </div>

            <GlassButton type="submit" className="w-full" disabled={loading}>
                {loading ? <span className="flex items-center justify-center gap-2"><Loader2 className="animate-spin w-4 h-4"/> Creating...</span> : 'Create Portal'}
            </GlassButton>
        </form>

        <div className="mt-6 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
                Already have an account? <span onClick={() => navigate('/login')} className="text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline">Login here</span>
            </p>
        </div>
      </GlassCard>
    </div>
  );
};

export default SetupWizard;