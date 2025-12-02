import React, { useState } from 'react';
import { GlassCard, GlassButton, GlassInput } from '../components/GlassUI';
import { Role } from '../types';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { User, Shield, GraduationCap, Building } from 'lucide-react';

interface Props {
  onLogin: (role: Role, userData: any) => void;
}

const Login: React.FC<Props> = ({ onLogin }) => {
  const [role, setRole] = useState<Role>(Role.STUDENT);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
      id: '', // RegNo or Email
      password: '',
      classId: '',
  });
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    let credentials: any = {};
    
    // Admin Login now uses Email & Password
    if (role === Role.ADMIN) {
        credentials = { email: formData.id, password: formData.password };
    } 
    // Teacher Login (Simplified: ClassName + Password)
    else if (role === Role.TEACHER) {
        credentials = { classId: formData.classId, password: formData.password };
    } 
    // Student Login
    else if (role === Role.STUDENT) {
        credentials = { id: formData.id }; 
    }

    const response = await api.login(role, credentials);
    setLoading(false);

    if (response.success) {
        onLogin(role, response.user);
        if (role === Role.TEACHER) navigate('/dashboard/teacher');
        else if (role === Role.STUDENT) navigate('/result'); 
        else navigate('/dashboard/admin');
    } else {
        alert(response.message || "Invalid Login Credentials.");
    }
  };

  const getRoleButtonClass = (isActive: boolean) => 
    `flex-1 py-2 rounded-md text-xs md:text-sm font-medium transition-all flex items-center justify-center gap-2 ${
        isActive 
        ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600' 
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
    }`;

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <GlassCard className="w-full max-w-md shadow-lg border-slate-200 dark:border-slate-700">
        <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Portal Login</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Access your school dashboard</p>
        </div>
        
        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-6 border border-slate-200 dark:border-slate-700">
            <button 
                onClick={() => setRole(Role.STUDENT)}
                className={getRoleButtonClass(role === Role.STUDENT)}
            >
                <GraduationCap className="w-4 h-4" /> Student
            </button>
            <button 
                onClick={() => setRole(Role.TEACHER)}
                className={getRoleButtonClass(role === Role.TEACHER)}
            >
                <User className="w-4 h-4" /> Teacher
            </button>
            <button 
                onClick={() => setRole(Role.ADMIN)}
                className={getRoleButtonClass(role === Role.ADMIN)}
            >
                <Building className="w-4 h-4" /> Admin
            </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            
            {role === Role.TEACHER && (
                 <div>
                    <label className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-1 block">Class Name (e.g., 10 A)</label>
                    <GlassInput 
                        placeholder="10 A"
                        value={formData.classId}
                        onChange={(e) => setFormData({...formData, classId: e.target.value})}
                        required
                    />
                </div>
            )}

            {role === Role.STUDENT && (
                <div>
                    <label className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-1 block">Register Number</label>
                     <GlassInput 
                        placeholder="e.g., 1001"
                        value={formData.id}
                        onChange={(e) => setFormData({...formData, id: e.target.value})}
                    />
                </div>
            )}

            {role === Role.ADMIN && (
                <div>
                    <label className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-1 block">Admin Email</label>
                     <GlassInput 
                        type="email"
                        placeholder="admin@school.com"
                        value={formData.id}
                        onChange={(e) => setFormData({...formData, id: e.target.value})}
                    />
                </div>
            )}

            {role !== Role.STUDENT && (
                <div>
                    <label className="text-slate-700 dark:text-slate-300 font-medium text-sm mb-1 block">Password</label>
                    <GlassInput 
                        type="password" 
                        placeholder="••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                </div>
            )}

            <GlassButton type="submit" className="w-full mt-2" disabled={loading}>
                {loading ? 'Authenticating...' : 'Secure Login'}
            </GlassButton>
        </form>
        
        {role === Role.ADMIN && (
            <div className="mt-4 text-center">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    New School? <span onClick={() => navigate('/setup')} className="text-blue-600 dark:text-blue-400 cursor-pointer font-bold hover:underline">Register Here</span>
                </p>
            </div>
        )}
      </GlassCard>
    </div>
  );
};

export default Login;