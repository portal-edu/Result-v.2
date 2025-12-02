import React, { useEffect, useState } from 'react';
import { GlassCard, GlassButton, GlassInput, GlassSelect } from '../components/GlassUI';
import { api } from '../services/api';
import { SchoolConfig, ClassData } from '../types';
import { Shield, Crown, Check, AlertCircle, Zap, ExternalLink, Link as LinkIcon, Copy, LayoutGrid, Users, ArrowLeft, Trash2 } from 'lucide-react';
import { getSupabaseConfig } from '../services/supabaseClient';

type Tab = 'dashboard' | 'classes' | 'upload';

const DashboardAdmin: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [config, setConfig] = useState<SchoolConfig | null>(null);
  
  // License State
  const [licenseKey, setLicenseKey] = useState('');
  const [activating, setActivating] = useState(false);
  const [magicLinkCopied, setMagicLinkCopied] = useState(false);

  // Class Management State
  const [classList, setClassList] = useState<ClassData[]>([]);
  const [newClass, setNewClass] = useState({ name: '', password: '', subjects: 'Maths, English, Malayalam' });
  const [loadingClasses, setLoadingClasses] = useState(false);

  // Student Upload State
  const [uploadClassId, setUploadClassId] = useState('');
  const [csvData, setCsvData] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    if (activeTab === 'classes' || activeTab === 'upload') {
        loadClasses();
    }
  }, [activeTab]);

  const loadConfig = async () => {
    const data = await api.getSchoolConfig();
    setConfig(data);
  };

  const loadClasses = async () => {
      setLoadingClasses(true);
      const classes = await api.getClasses();
      setClassList(classes);
      setLoadingClasses(false);
  };

  const handleActivate = async () => {
      if (!licenseKey) return;
      setActivating(true);
      const res = await api.activateLicense(licenseKey);
      setActivating(false);
      if (res.success) {
          alert(res.message);
          loadConfig();
          setLicenseKey('');
      } else {
          alert(res.message);
      }
  };

  const handleCopyMagicLink = () => {
      const { url, key } = getSupabaseConfig();
      if (!url || !key) {
          alert("Database configuration missing.");
          return;
      }
      const payload = JSON.stringify({ u: url, k: key });
      const encoded = btoa(payload);
      const link = `${window.location.origin}${window.location.pathname}?cfg=${encoded}#/login`;
      
      navigator.clipboard.writeText(link);
      setMagicLinkCopied(true);
      setTimeout(() => setMagicLinkCopied(false), 2000);
  };

  const handleCreateClass = async (e: React.FormEvent) => {
      e.preventDefault();
      // Split string by comma and trim. API converts these to SubjectConfig objects with default marks.
      const subjectsArray = newClass.subjects.split(',').map(s => s.trim()).filter(s => s);
      const res = await api.createClass(newClass.name, newClass.password, subjectsArray);
      if (res.success) {
          alert("Class Created Successfully!");
          setNewClass({ name: '', password: '', subjects: 'Maths, English, Malayalam' });
          loadClasses();
      } else {
          alert("Failed: " + res.message);
      }
  };

  const handleDeleteClass = async (id: string) => {
      if (!window.confirm("Are you sure? This will delete the class. (Note: Only classes with no students can be safely deleted if constraint exists)")) return;
      
      const res = await api.deleteClass(id);
      if (res.success) {
          loadClasses();
      } else {
          alert("Delete failed: " + res.message);
      }
  };

  const handleBulkUpload = async () => {
      if (!uploadClassId) { alert("Please select a class"); return; }
      if (!csvData) { alert("Please enter data"); return; }
      
      setUploading(true);
      // Parse CSV: RegNo, Name, DOB
      const lines = csvData.trim().split('\n');
      const students = [];
      
      for (const line of lines) {
          const parts = line.split(',');
          if (parts.length >= 3) {
              students.push({
                  regNo: parts[0].trim(),
                  name: parts[1].trim(),
                  dob: parts[2].trim() // Expected YYYY-MM-DD
              });
          }
      }

      if (students.length === 0) {
          alert("Invalid data format. Use: RegNo, Name, DOB");
          setUploading(false);
          return;
      }

      const res = await api.addStudents(uploadClassId, students);
      setUploading(false);
      
      if (res.success) {
          alert(`Successfully uploaded ${students.length} students!`);
          setCsvData('');
      } else {
          alert("Upload failed: " + res.message);
      }
  };

  if (!config) return <div className="p-10 text-center text-slate-500">Loading settings...</div>;

  // Render content based on Active Tab
  const renderContent = () => {
      if (activeTab === 'classes') {
          return (
              <div className="space-y-6 animate-fade-in-up">
                  <div className="flex items-center gap-4">
                      <GlassButton variant="secondary" onClick={() => setActiveTab('dashboard')}><ArrowLeft className="w-4 h-4"/></GlassButton>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">Class Management</h3>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                      <GlassCard>
                          <h4 className="font-semibold mb-4 text-slate-700 dark:text-slate-200">Add New Class</h4>
                          <form onSubmit={handleCreateClass} className="space-y-4">
                              <div>
                                  <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">Class Name</label>
                                  <GlassInput 
                                    placeholder="e.g. 10 A" 
                                    value={newClass.name}
                                    onChange={e => setNewClass({...newClass, name: e.target.value})}
                                    required
                                  />
                              </div>
                              <div>
                                  <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">Teacher Password</label>
                                  <GlassInput 
                                    placeholder="Set a password for teacher" 
                                    value={newClass.password}
                                    onChange={e => setNewClass({...newClass, password: e.target.value})}
                                    required
                                  />
                              </div>
                              <div>
                                  <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">Subjects (Comma separated)</label>
                                  <GlassInput 
                                    placeholder="Maths, English, Physics" 
                                    value={newClass.subjects}
                                    onChange={e => setNewClass({...newClass, subjects: e.target.value})}
                                    required
                                  />
                              </div>
                              <GlassButton type="submit" className="w-full">Create Class</GlassButton>
                          </form>
                      </GlassCard>

                      <GlassCard>
                          <h4 className="font-semibold mb-4 text-slate-700 dark:text-slate-200">Existing Classes</h4>
                          {loadingClasses ? <p className="text-sm text-slate-500">Loading...</p> : (
                              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                                  {classList.length === 0 ? <p className="text-sm text-slate-400">No classes found.</p> : classList.map(cls => (
                                      <div key={cls.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-lg flex justify-between items-center group">
                                          <div>
                                              <p className="font-bold text-slate-800 dark:text-slate-100">{cls.name}</p>
                                              <p className="text-xs text-slate-500 dark:text-slate-400">{cls.subjects.length} Subjects</p>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <div className="text-xs bg-white dark:bg-slate-800 px-2 py-1 border dark:border-slate-600 rounded text-slate-500 dark:text-slate-300 font-mono">
                                                Pass: {cls.password}
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteClass(cls.id)}
                                                className="text-slate-400 hover:text-red-500 transition-colors p-1"
                                                title="Delete Class"
                                            >
                                                <Trash2 className="w-4 h-4"/>
                                            </button>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          )}
                      </GlassCard>
                  </div>
              </div>
          );
      }

      if (activeTab === 'upload') {
        return (
            <div className="space-y-6 animate-fade-in-up">
                <div className="flex items-center gap-4">
                    <GlassButton variant="secondary" onClick={() => setActiveTab('dashboard')}><ArrowLeft className="w-4 h-4"/></GlassButton>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white">Bulk Student Upload</h3>
                </div>

                <GlassCard className="max-w-2xl mx-auto">
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">Select Class</label>
                            <GlassSelect value={uploadClassId} onChange={e => setUploadClassId(e.target.value)}>
                                <option value="">-- Choose Class --</option>
                                {classList.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </GlassSelect>
                        </div>
                        
                        <div>
                            <label className="text-sm text-slate-600 dark:text-slate-400 block mb-1">Paste Student Data (CSV format)</label>
                            <p className="text-xs text-slate-400 mb-2">Format: RegNo, Name, DOB(YYYY-MM-DD)</p>
                            <textarea 
                                className="w-full h-40 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-sm font-mono focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-slate-100"
                                placeholder={`1001, Arjun Das, 2008-05-12\n1002, Fathima R, 2008-08-20`}
                                value={csvData}
                                onChange={e => setCsvData(e.target.value)}
                            ></textarea>
                        </div>

                        <GlassButton onClick={handleBulkUpload} disabled={uploading} className="w-full">
                            {uploading ? 'Uploading...' : 'Upload Students'}
                        </GlassButton>
                    </div>
                </GlassCard>
            </div>
        );
      }

      // Default Dashboard View
      return (
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in-up">
            {/* License Management Card */}
            <GlassCard className="h-full relative overflow-hidden border-slate-200 dark:border-slate-700">
                {config.isPro && (
                    <div className="absolute top-0 right-0 p-4">
                        <Crown className="w-24 h-24 text-yellow-100 dark:text-yellow-900/20 rotate-12" />
                    </div>
                )}
                
                <div className="flex items-center gap-3 mb-6">
                    <div className={`p-2 rounded-lg ${config.isPro ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        <Shield className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">License & Plan</h3>
                </div>

                <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-6 mb-6 border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">Current Status</span>
                        {config.isPro ? (
                            <span className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800 rounded-full text-xs font-bold flex items-center gap-2">
                                <Crown className="w-3 h-3" /> PRO ACTIVE
                            </span>
                        ) : (
                            <span className="px-3 py-1 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 border border-slate-300 dark:border-slate-500 rounded-full text-xs font-bold">
                                FREE TIER
                            </span>
                        )}
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400 font-medium">License Key</span>
                        <span className="font-mono text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 px-2 py-1 rounded border border-slate-200 dark:border-slate-600 text-sm">{config.licenseKey}</span>
                    </div>
                </div>

                {!config.isPro ? (
                    <div className="space-y-4">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Upgrade to Pro to unlock unlimited students.</p>
                        <div className="flex gap-2">
                            <GlassInput 
                                placeholder="Enter Pro Key (Try 'PRO-2024')" 
                                value={licenseKey}
                                onChange={(e) => setLicenseKey(e.target.value)}
                            />
                            <GlassButton onClick={handleActivate} disabled={activating}>
                                {activating ? '...' : 'Activate'}
                            </GlassButton>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold">Pro Features Enabled:</p>
                        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                            <li className="flex gap-2 items-center"><Check className="w-4 h-4 text-green-500"/> Unlimited Student Records</li>
                        </ul>
                    </div>
                )}
            </GlassCard>

            {/* Other Admin Controls */}
            <div className="space-y-6">
                <GlassCard>
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-800 dark:text-white">
                        <Zap className="w-5 h-5 text-blue-600 dark:text-blue-400" /> Quick Actions
                    </h3>
                    <div className="space-y-4">
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-lg">
                            <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                                <LinkIcon className="w-4 h-4" /> Magic Link
                            </h4>
                            <p className="text-sm text-blue-800/80 dark:text-blue-300/80 mb-3">
                                Share this link with teachers and parents. It will automatically connect their device to this portal.
                            </p>
                            <GlassButton 
                                onClick={handleCopyMagicLink} 
                                className="w-full bg-blue-600 hover:bg-blue-700 flex justify-center items-center gap-2"
                            >
                                {magicLinkCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                {magicLinkCopied ? 'Copied!' : 'Copy Magic Link'}
                            </GlassButton>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <GlassButton variant="secondary" onClick={() => setActiveTab('classes')} className="text-sm py-4 justify-center flex flex-col gap-2 h-auto">
                                <LayoutGrid className="w-6 h-6 text-slate-600 dark:text-slate-300"/>
                                Manage Classes
                            </GlassButton>
                            <GlassButton variant="secondary" onClick={() => setActiveTab('upload')} className="text-sm py-4 justify-center flex flex-col gap-2 h-auto">
                                <Users className="w-6 h-6 text-slate-600 dark:text-slate-300"/>
                                Bulk Upload
                            </GlassButton>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50">
                    <div className="flex items-start gap-3">
                        <AlertCircle className="w-6 h-6 text-red-500 dark:text-red-400 shrink-0" />
                        <div>
                            <h4 className="font-bold text-red-700 dark:text-red-400">Maintenance Mode</h4>
                            <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1">
                                Closing the portal will prevent students from checking results.
                            </p>
                            <button className="mt-3 text-xs bg-white dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-200 hover:bg-red-50 dark:hover:bg-red-800 px-3 py-1.5 rounded font-medium transition-colors">
                                Close Portal
                            </button>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </div>
      );
  };

  return (
    <div className="pb-20">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Administrator Console</h2>
             <p className="text-slate-500 dark:text-slate-400">{config.schoolName}</p>
        </div>
        <div className="flex gap-2">
             <GlassButton variant="secondary" onClick={() => window.open('https://supabase.com/dashboard/project/_/editor', '_blank')}>
                <ExternalLink className="w-4 h-4 inline mr-2" /> Database
             </GlassButton>
        </div>
      </div>

      {renderContent()}
    </div>
  );
};

export default DashboardAdmin;