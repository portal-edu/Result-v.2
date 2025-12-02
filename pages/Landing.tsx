import React, { useState } from 'react';
import { GlassCard, GlassButton } from '../components/GlassUI';
import { Calculator, CheckCircle, Database, Smartphone, ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState(100);
  const ratePerStudent = 3;

  return (
    <div className="pb-20 text-slate-900 dark:text-slate-100">
      {/* Hero Section */}
      <header className="text-center py-16 md:py-24 max-w-4xl mx-auto">
        <div className="inline-block px-4 py-1.5 mb-6 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-sm font-semibold tracking-wide">
            ✨ Professional Result Management System
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-slate-900 dark:text-white tracking-tight leading-tight">
          Manage School Results <br/>
          <span className="text-blue-600 dark:text-blue-400">Without Servers</span>
        </h1>
        <p className="text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Create a branded result portal for your school or tuition center. 
          Uses Supabase/GitHub for a zero-maintenance experience.
        </p>
        <div className="flex flex-col md:flex-row justify-center gap-4">
          <GlassButton onClick={() => navigate('/setup')} className="text-lg px-8 py-3 shadow-blue-200 dark:shadow-none shadow-xl">
            Start Free Portal <ArrowRight className="inline ml-2 w-5 h-5" />
          </GlassButton>
          <GlassButton variant="secondary" onClick={() => navigate('/login')} className="text-lg px-8 py-3">
            Staff Login
          </GlassButton>
          <GlassButton variant="secondary" onClick={() => navigate('/result')} className="text-lg px-8 py-3 text-slate-600 dark:text-slate-300">
            Public Result
          </GlassButton>
        </div>
      </header>

      {/* Calculator Section */}
      <section className="py-12">
        <GlassCard className="max-w-4xl mx-auto transform hover:shadow-lg transition-all duration-300 border-slate-200 dark:border-slate-700">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <Calculator className="w-6 h-6 text-blue-600 dark:text-blue-400" /> Transparent Pricing
              </h2>
              <p className="text-slate-500 dark:text-slate-400 mb-6">
                Pay only for what you use per term. No hidden server fees.
              </p>
              <div className="mb-2 flex justify-between font-medium">
                <span className="text-slate-700 dark:text-slate-300">Student Count:</span>
                <span className="font-bold text-2xl text-blue-600 dark:text-blue-400">{students}</span>
              </div>
              <input 
                type="range" 
                min="50" 
                max="2000" 
                step="50"
                value={students}
                onChange={(e) => setStudents(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer mb-8 accent-blue-600"
              />
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><CheckCircle className="w-4 h-4 text-green-500" /> Unlimited Classes</li>
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><CheckCircle className="w-4 h-4 text-green-500" /> Free Admin Dashboard</li>
                <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300"><CheckCircle className="w-4 h-4 text-green-500" /> Lifetime Updates</li>
              </ul>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-8 text-center border border-slate-200 dark:border-slate-800">
              <p className="text-lg text-slate-500 dark:text-slate-400 mb-2 font-medium">Total Cost per Term</p>
              <div className="text-5xl font-bold mb-2 text-slate-900 dark:text-white">₹{students * ratePerStudent}</div>
              <p className="text-sm text-slate-400 mb-8">@ ₹{ratePerStudent}/student</p>
              <GlassButton className="w-full mb-4">Pay Now (UPI)</GlassButton>
              <p className="text-xs text-slate-400">Secure payment via UPI QR. Send screenshot to activate Pro.</p>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Features Grid */}
      <section className="py-10">
        <div className="grid md:grid-cols-3 gap-6">
            <GlassCard className="text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Database className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-slate-100">Secure Database</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">You own your data. Database is stored in Supabase with enterprise-grade security.</p>
            </GlassCard>
            <GlassCard className="text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Smartphone className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-slate-100">Mobile First</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Responsive design allowing teachers to enter marks and students to check results on the go.</p>
            </GlassCard>
             <GlassCard className="text-center hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Zap className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <h3 className="text-lg font-bold mb-2 text-slate-800 dark:text-slate-100">Instant Setup</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Use our Setup Wizard to initialize your database and go live in less than 2 minutes.</p>
            </GlassCard>
        </div>
      </section>
    </div>
  );
};

export default Landing;