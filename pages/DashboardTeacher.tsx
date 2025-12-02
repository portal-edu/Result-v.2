import React, { useEffect, useState } from 'react';
import { GlassCard, GlassButton, GlassSelect, GlassInput } from '../components/GlassUI';
import { api } from '../services/api';
import { Student, Marks, ClassData, ProfileRequest, SubjectConfig } from '../types';
import { Save, RefreshCw, Printer, AlertTriangle, Check, X, UserCog, Table, BookOpen, FileText, Settings, Plus, Trash2 } from 'lucide-react';

interface Props {
  user: ClassData;
}

// Pre-defined Subject Templates
const SUBJECT_TEMPLATES: Record<string, string[]> = {
    'STATE_10': ['Malayalam-I', 'Malayalam-II', 'English', 'Hindi', 'Physics', 'Chemistry', 'Biology', 'Social Science', 'Maths', 'IT'],
    'CBSE_10': ['English', 'Hindi', 'Maths', 'Science', 'Social Science'],
    'PLUS_TWO_SCI': ['English', 'Second Lang', 'Physics', 'Chemistry', 'Maths', 'Computer Science'],
    'PLUS_TWO_BIO': ['English', 'Second Lang', 'Physics', 'Chemistry', 'Biology', 'Maths'],
    'LP_UP': ['Malayalam', 'English', 'Maths', 'Basic Science', 'Social Science']
};

const DashboardTeacher: React.FC<Props> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'marks' | 'requests' | 'reports'>('marks');
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, Marks>>({});
  const [requests, setRequests] = useState<ProfileRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<'Term 1' | 'Term 2'>('Term 1');
  const [currentSubjects, setCurrentSubjects] = useState<SubjectConfig[]>(user.subjects);
  
  // Subject Settings Modal State
  const [showSubjectSettings, setShowSubjectSettings] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectMax, setNewSubjectMax] = useState('100');

  // For Reports
  const [rankList, setRankList] = useState<any[]>([]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
      if (activeTab === 'requests') {
          loadRequests();
      }
      if (activeTab === 'reports') {
          generateRankList();
      }
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    const stuList = await api.getStudentsByClass(user.id);
    setStudents(stuList);
    
    // Fetch marks
    const marksMap: Record<string, Marks> = {};
    for (const stu of stuList) {
        const m = await api.getMarks(stu.id, selectedTerm);
        if (m) marksMap[stu.id] = m;
        else {
            marksMap[stu.id] = {
                studentId: stu.id,
                subjects: currentSubjects.reduce((acc, sub) => ({...acc, [sub.name]: 0}), {}),
                total: 0,
                grade: 'F',
                term: selectedTerm
            }
        }
    }
    setMarks(marksMap);
    
    // Check for pending requests count only
    const reqs = await api.getPendingRequestsForClass(user.id);
    setRequests(reqs);

    setLoading(false);
  };

  const loadRequests = async () => {
      setLoading(true);
      const reqs = await api.getPendingRequestsForClass(user.id);
      setRequests(reqs);
      setLoading(false);
  };

  const handleMarkChange = (studentId: string, subject: string, value: string) => {
      const numVal = parseInt(value) || 0;
      setMarks(prev => {
          const studentMarks = { ...prev[studentId] };
          studentMarks.subjects = { ...studentMarks.subjects, [subject]: numVal };
          
          const total = (Object.values(studentMarks.subjects) as number[]).reduce((a, b) => a + b, 0);
          studentMarks.total = total;
          
          // Calculate percentage based on Max Marks of each subject
          let maxTotal = 0;
          Object.keys(studentMarks.subjects).forEach(subName => {
              const subConfig = currentSubjects.find(s => s.name === subName);
              maxTotal += subConfig ? subConfig.maxMarks : 100;
          });

          const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

          if (percentage >= 90) studentMarks.grade = 'A+';
          else if (percentage >= 80) studentMarks.grade = 'A';
          else if (percentage >= 70) studentMarks.grade = 'B+';
          else if (percentage >= 60) studentMarks.grade = 'B';
          else if (percentage >= 50) studentMarks.grade = 'C+';
          else if (percentage >= 40) studentMarks.grade = 'C';
          else studentMarks.grade = 'D';

          return { ...prev, [studentId]: studentMarks };
      });
  };

  const handleSaveAll = async () => {
      setLoading(true);
      for (const m of Object.values(marks) as Marks[]) {
          await api.saveMarks(m);
      }
      setLoading(false);
      alert("All marks saved successfully!");
  };

  const handleResolveRequest = async (req: ProfileRequest, action: 'APPROVED' | 'REJECTED') => {
      const res = await api.resolveProfileRequest(req, action);
      if (res.success) {
          loadRequests(); // Refresh list
          if (action === 'APPROVED') loadData(); // Refresh students if name/data changed
      } else {
          alert("Error: " + res.message);
      }
  };

  const applySubjectTemplate = async (templateKey: string) => {
      if (!templateKey) return;
      if (!window.confirm("Changing subjects will reset subject configuration. Continue?")) return;

      const newSubjectsNames = SUBJECT_TEMPLATES[templateKey];
      if (newSubjectsNames) {
          setLoading(true);
          const newSubjectsConfig: SubjectConfig[] = newSubjectsNames.map(s => ({ name: s, maxMarks: 100 })); // Default 100
          
          const res = await api.updateClassSubjects(user.id, newSubjectsConfig);
          if (res.success) {
              setCurrentSubjects(newSubjectsConfig);
              setTimeout(loadData, 500); 
              alert("Subjects updated successfully! Check Settings to adjust Max Marks.");
          } else {
              alert("Failed to update subjects.");
          }
          setLoading(false);
      }
  };

  const saveSubjectConfig = async (newConfig: SubjectConfig[]) => {
      setLoading(true);
      const res = await api.updateClassSubjects(user.id, newConfig);
      setLoading(false);
      if (res.success) {
          setCurrentSubjects(newConfig);
          setShowSubjectSettings(false);
          loadData(); // Reload marks structure
      } else {
          alert("Failed to save subject settings");
      }
  };

  const addSubject = () => {
      if (!newSubjectName) return;
      const max = parseInt(newSubjectMax) || 100;
      const newConfig = [...currentSubjects, { name: newSubjectName, maxMarks: max }];
      saveSubjectConfig(newConfig);
      setNewSubjectName('');
      setNewSubjectMax('100');
  };

  const deleteSubject = (index: number) => {
      if (!window.confirm("Delete this subject? Existing marks for this subject may be hidden.")) return;
      const newConfig = [...currentSubjects];
      newConfig.splice(index, 1);
      saveSubjectConfig(newConfig);
  };

  const updateSubjectMax = (index: number, val: string) => {
      const newConfig = [...currentSubjects];
      newConfig[index].maxMarks = parseInt(val) || 0;
      // We don't save immediately, maybe we should? For now let's create a 'Save' button in modal if complex. 
      // But for simplicity, let's just update local state if we were using a local copy. 
      // Since we are saving entire array on ADD/DELETE, let's do direct save here for simplicity or UI might be laggy.
      // Better UX: Have a local state for the modal.
  };
  
  // Actually, let's use a local state for the modal editing to prevent too many API calls
  const [tempSubjects, setTempSubjects] = useState<SubjectConfig[]>([]);

  useEffect(() => {
      if (showSubjectSettings) {
          setTempSubjects([...currentSubjects]);
      }
  }, [showSubjectSettings, currentSubjects]);

  const saveModalChanges = () => {
      saveSubjectConfig(tempSubjects);
  };

  const generateRankList = async () => {
      setLoading(true);
      const rankedData = students.map(stu => {
          const m = marks[stu.id];
          return {
              regNo: stu.regNo,
              name: stu.name,
              total: m ? m.total : 0,
              grade: m ? m.grade : '-',
              marks: m ? m.subjects : {}
          };
      });

      rankedData.sort((a, b) => b.total - a.total);
      
      setRankList(rankedData);
      setLoading(false);
  };

  return (
    <div className="pb-20 relative">
      {/* Subject Settings Modal */}
      {showSubjectSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
              <GlassCard className="w-full max-w-lg bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                          <Settings className="w-5 h-5"/> Subject Configuration
                      </h3>
                      <button onClick={() => setShowSubjectSettings(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X className="w-5 h-5"/></button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 p-1">
                      {tempSubjects.map((sub, idx) => (
                          <div key={idx} className="flex gap-2 items-center bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-slate-100 dark:border-slate-700">
                              <div className="flex-1">
                                  <p className="font-medium text-slate-800 dark:text-white">{sub.name}</p>
                              </div>
                              <div className="w-24">
                                  <label className="text-[10px] text-slate-400 block">Max Marks</label>
                                  <input 
                                    type="number" 
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-sm text-center"
                                    value={sub.maxMarks}
                                    onChange={(e) => {
                                        const newArr = [...tempSubjects];
                                        newArr[idx].maxMarks = parseInt(e.target.value) || 0;
                                        setTempSubjects(newArr);
                                    }}
                                  />
                              </div>
                              <button 
                                onClick={() => {
                                    const newArr = [...tempSubjects];
                                    newArr.splice(idx, 1);
                                    setTempSubjects(newArr);
                                }}
                                className="text-red-400 hover:text-red-600 p-2"
                              >
                                  <Trash2 className="w-4 h-4"/>
                              </button>
                          </div>
                      ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                      <div className="flex gap-2">
                          <GlassInput 
                            placeholder="New Subject Name" 
                            value={newSubjectName} 
                            onChange={e => setNewSubjectName(e.target.value)}
                            className="flex-1 text-sm"
                          />
                          <GlassInput 
                            type="number"
                            placeholder="Max" 
                            value={newSubjectMax} 
                            onChange={e => setNewSubjectMax(e.target.value)}
                            className="w-20 text-sm"
                          />
                          <GlassButton onClick={() => {
                              if(newSubjectName) {
                                  setTempSubjects([...tempSubjects, { name: newSubjectName, maxMarks: parseInt(newSubjectMax) || 100 }]);
                                  setNewSubjectName('');
                                  setNewSubjectMax('100');
                              }
                          }} variant="secondary" className="px-3">
                              <Plus className="w-4 h-4"/>
                          </GlassButton>
                      </div>
                      <GlassButton onClick={saveModalChanges} className="w-full">Save Changes</GlassButton>
                  </div>
              </GlassCard>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4 print:hidden">
        <div>
             <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Class {user.name} Dashboard</h2>
             <p className="text-slate-500 dark:text-slate-400">Teacher ID: {user.teacherId}</p>
        </div>
        <div className="flex gap-2">
            <GlassButton onClick={() => setActiveTab('marks')} variant={activeTab === 'marks' ? 'primary' : 'secondary'} className="flex items-center gap-2">
                <Table className="w-4 h-4"/> Marks
            </GlassButton>
             <GlassButton onClick={() => setActiveTab('reports')} variant={activeTab === 'reports' ? 'primary' : 'secondary'} className="flex items-center gap-2">
                <FileText className="w-4 h-4"/> Reports
            </GlassButton>
            <GlassButton onClick={() => setActiveTab('requests')} variant={activeTab === 'requests' ? 'primary' : 'secondary'} className="flex items-center gap-2 relative">
                <UserCog className="w-4 h-4"/> 
                Requests
                {requests.length > 0 && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-white dark:border-slate-800">{requests.length}</span>}
            </GlassButton>
        </div>
      </div>

      {activeTab === 'marks' && (
          <div className="animate-fade-in-up">
            <GlassCard className="mb-6 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700">
                <div className="flex flex-col md:flex-row gap-6 items-end">
                    <div className="w-full md:w-1/4">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 block">Academic Term</label>
                        <GlassSelect value={selectedTerm} onChange={(e) => setSelectedTerm(e.target.value as any)}>
                            <option value="Term 1">Term 1</option>
                            <option value="Term 2">Term 2</option>
                        </GlassSelect>
                    </div>
                    <div className="w-full md:w-1/4">
                        <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-2">
                            <BookOpen className="w-3 h-3 text-blue-600 dark:text-blue-400"/> Templates
                        </label>
                        <GlassSelect onChange={(e) => applySubjectTemplate(e.target.value)}>
                            <option value="">Select Template...</option>
                            <option value="STATE_10">Kerala State 10th</option>
                            <option value="CBSE_10">CBSE 10th</option>
                            <option value="PLUS_TWO_SCI">Plus Two (Science)</option>
                            <option value="PLUS_TWO_BIO">Plus Two (Bio-Maths)</option>
                            <option value="LP_UP">LP / UP General</option>
                        </GlassSelect>
                    </div>
                    <div className="w-full md:w-1/4 flex gap-2">
                         <GlassButton 
                            onClick={() => setShowSubjectSettings(true)} 
                            variant="secondary" 
                            className="w-full flex items-center justify-center gap-2"
                        >
                            <Settings className="w-4 h-4" /> Subjects
                         </GlassButton>
                    </div>
                    <div className="w-full md:w-1/4 flex gap-2 justify-end">
                         <GlassButton onClick={loadData} variant="secondary" title="Reload"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /></GlassButton>
                         <GlassButton onClick={handleSaveAll} className="flex items-center gap-2 shadow-lg shadow-blue-200 dark:shadow-none"><Save className="w-4 h-4"/> Save</GlassButton>
                    </div>
                </div>
            </GlassCard>

            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <div className="min-w-[800px] bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 text-sm uppercase tracking-wider">
                                <th className="p-4 font-semibold sticky left-0 bg-slate-50 dark:bg-slate-800 z-10 border-r border-slate-100 dark:border-slate-700">Reg No</th>
                                <th className="p-4 font-semibold sticky left-24 bg-slate-50 dark:bg-slate-800 z-10 border-r border-slate-100 dark:border-slate-700">Student Name</th>
                                {currentSubjects.map(sub => (
                                    <th key={sub.name} className="p-4 text-center font-semibold text-xs">
                                        <div className="flex flex-col">
                                            <span>{sub.name}</span>
                                            <span className="text-[10px] text-slate-400 normal-case">Max: {sub.maxMarks}</span>
                                        </div>
                                    </th>
                                ))}
                                <th className="p-4 text-center font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/50">Total</th>
                                <th className="p-4 text-center font-semibold">Grade</th>
                            </tr>
                        </thead>
                        <tbody className="text-slate-700 dark:text-slate-300">
                            {students.map((stu, idx) => (
                                <tr key={stu.id} className={`border-b border-slate-100 dark:border-slate-700 hover:bg-blue-50/30 dark:hover:bg-slate-800 transition-colors ${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/50'}`}>
                                    <td className="p-4 sticky left-0 bg-inherit z-10 font-mono text-sm border-r border-slate-100 dark:border-slate-700 font-medium">{stu.regNo}</td>
                                    <td className="p-4 sticky left-24 bg-inherit z-10 font-medium border-r border-slate-100 dark:border-slate-700 text-slate-900 dark:text-slate-100">{stu.name}</td>
                                    {currentSubjects.map(sub => {
                                        const currentMark = marks[stu.id]?.subjects[sub.name] || 0;
                                        const isInvalid = currentMark > sub.maxMarks;
                                        
                                        return (
                                            <td key={sub.name} className="p-2 text-center">
                                                <div className="relative inline-block">
                                                    <input 
                                                        type="number"
                                                        className={`w-16 bg-white dark:bg-slate-800 border rounded px-2 py-1.5 text-center focus:ring-2 focus:outline-none transition-all text-slate-900 dark:text-white ${isInvalid ? 'border-red-500 ring-red-200 bg-red-50 dark:bg-red-900/20' : 'border-slate-200 dark:border-slate-600 focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900'}`}
                                                        value={currentMark}
                                                        onChange={(e) => handleMarkChange(stu.id, sub.name, e.target.value)}
                                                    />
                                                    {isInvalid && (
                                                        <div className="absolute -top-2 -right-2 text-red-500">
                                                            <AlertTriangle className="w-3 h-3"/>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                    <td className="p-4 text-center font-bold text-lg text-slate-900 dark:text-white bg-slate-50/50 dark:bg-slate-800/30">{marks[stu.id]?.total || 0}</td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                            (marks[stu.id]?.grade === 'F' || marks[stu.id]?.grade === 'D') ? 'bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300' : 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                                        }`}>
                                            {marks[stu.id]?.grade || '-'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
          </div>
      )}

      {activeTab === 'reports' && (
          <div className="animate-fade-in-up">
              <div className="flex justify-between items-center mb-6 print:hidden">
                  <div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">Class Rank List</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{selectedTerm} | {students.length} Students</p>
                  </div>
                  <GlassButton onClick={() => window.print()} className="flex items-center gap-2">
                      <Printer className="w-4 h-4"/> Print List
                  </GlassButton>
              </div>

              {/* Printable Area */}
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 print:shadow-none print:border-none print:p-0">
                  <div className="text-center mb-6 border-b border-slate-200 pb-4 hidden print:block">
                      <h1 className="text-2xl font-bold uppercase tracking-wider">Class Report Card</h1>
                      <p className="text-slate-600">Class: {user.name} | {selectedTerm}</p>
                  </div>

                  <table className="w-full text-left border-collapse">
                      <thead>
                          <tr className="bg-slate-100 text-slate-800 text-sm border-y border-slate-300">
                              <th className="p-3 font-bold w-16 text-center">Rank</th>
                              <th className="p-3 font-bold">Student Name</th>
                              <th className="p-3 font-bold w-24 text-center">Reg No</th>
                              {currentSubjects.map(sub => (
                                  <th key={sub.name} className="p-3 text-center text-xs font-semibold print:text-[10px]">{sub.name.substring(0, 3)}</th>
                              ))}
                              <th className="p-3 text-center font-bold bg-slate-200">Total</th>
                              <th className="p-3 text-center font-bold">Grade</th>
                          </tr>
                      </thead>
                      <tbody className="text-slate-700">
                          {rankList.map((row, idx) => (
                              <tr key={row.regNo} className="border-b border-slate-100">
                                  <td className="p-3 text-center font-bold text-slate-400">
                                      {idx < 3 ? (
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center mx-auto text-xs text-white ${idx === 0 ? 'bg-yellow-400' : idx === 1 ? 'bg-slate-400' : 'bg-orange-400'}`}>
                                              {idx + 1}
                                          </div>
                                      ) : idx + 1}
                                  </td>
                                  <td className="p-3 font-medium">{row.name}</td>
                                  <td className="p-3 text-center font-mono text-sm text-slate-500">{row.regNo}</td>
                                  {currentSubjects.map(sub => (
                                      <td key={sub.name} className="p-3 text-center text-sm">{row.marks[sub.name] || '-'}</td>
                                  ))}
                                  <td className="p-3 text-center font-bold text-slate-900 bg-slate-50">{row.total}</td>
                                  <td className="p-3 text-center font-bold">{row.grade}</td>
                              </tr>
                          ))}
                      </tbody>
                  </table>

                  <div className="mt-8 pt-8 border-t border-slate-200 flex justify-between text-sm text-slate-500 hidden print:flex">
                      <p>Generated by SchoolResult Pro</p>
                      <p>Signature of Class Teacher</p>
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'requests' && (
          <div className="max-w-4xl mx-auto animate-fade-in-up">
              <h3 className="font-bold text-xl text-slate-800 dark:text-white mb-4">Pending Profile Edits</h3>
              {requests.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                      <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50"/>
                      <p>All clean! No pending requests.</p>
                  </div>
              ) : (
                  <div className="space-y-4">
                      {requests.map(req => (
                          <GlassCard key={req.id} className="flex flex-col md:flex-row justify-between items-center gap-4">
                              <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-slate-900 dark:text-white">{req.studentName}</span>
                                      <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-500 dark:text-slate-300 font-mono">{req.regNo}</span>
                                  </div>
                                  <p className="text-sm text-slate-600 dark:text-slate-300">
                                      Requests to change <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase">{req.field}</span> to:
                                  </p>
                                  <div className="mt-2 bg-slate-50 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 font-medium text-slate-800 dark:text-slate-100">
                                      {req.newValue}
                                  </div>
                              </div>
                              <div className="flex gap-2">
                                  <button 
                                    onClick={() => handleResolveRequest(req, 'APPROVED')}
                                    className="bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                                  >
                                      <Check className="w-4 h-4"/> Approve
                                  </button>
                                  <button 
                                    onClick={() => handleResolveRequest(req, 'REJECTED')}
                                    className="bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-400 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                                  >
                                      <X className="w-4 h-4"/> Reject
                                  </button>
                              </div>
                          </GlassCard>
                      ))}
                  </div>
              )}
          </div>
      )}
    </div>
  );
};

// Helper for empty state icon
const CheckCircle = ({className}: {className: string}) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export default DashboardTeacher;