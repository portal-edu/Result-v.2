import { supabase } from './supabaseClient';
import { ClassData, Marks, ProfileRequest, Role, Student, SchoolConfig, SubjectConfig } from '../types';

// Helper to get current school ID from session/local storage
const getSchoolId = () => localStorage.getItem('school_id');

// Helper to parse subjects from DB (handles string[] legacy data and new SubjectConfig[])
const parseSubjects = (json: any): SubjectConfig[] => {
    if (!json) return [];
    let parsed = typeof json === 'string' ? JSON.parse(json) : json;
    
    if (Array.isArray(parsed)) {
        if (parsed.length === 0) return [];
        // Handle legacy string array ["Maths", "Eng"]
        if (typeof parsed[0] === 'string') {
            return parsed.map((s: string) => ({ name: s, maxMarks: 100 }));
        }
        // Handle new object array
        return parsed as SubjectConfig[];
    }
    return [];
}

export const api = {
  // --- Auth & Registration ---
  
  registerSchool: async (name: string, email: string, password: string) => {
      try {
          // 1. Create user in Supabase Auth (Optional, skipping for simple table-based auth in demo)
          // 2. Insert into schools table
          const { data, error } = await supabase
            .from('schools')
            .insert([{ name, admin_email: email, license_key: password }]) 
            .select()
            .single();

          if (error) throw error;
          return { success: true, schoolId: data.id };
      } catch (e: any) {
          console.error(e);
          return { success: false, message: e.message };
      }
  },

  login: async (role: Role, credentials: any) => {
    try {
        if (role === Role.ADMIN) {
            const { data } = await supabase
                .from('schools')
                .select('*')
                .eq('admin_email', credentials.email) 
                .eq('license_key', credentials.password)
                .single();
            
            if (data) {
                localStorage.setItem('school_id', data.id); 
                return { success: true, user: data };
            }
        }
        
        if (role === Role.TEACHER) {
            const { data } = await supabase
                .from('classes')
                .select('*, schools(name)')
                .eq('name', credentials.classId) 
                .eq('teacher_password', credentials.password)
                .single();
            
            if (data) {
                localStorage.setItem('school_id', data.school_id);
                return { 
                    success: true, 
                    user: { 
                        ...data, 
                        name: data.name, 
                        subjects: parseSubjects(data.subjects) 
                    } 
                };
            }
        }

        if (role === Role.STUDENT) {
            const { data } = await supabase
                .from('students')
                .select('*, schools(name)')
                .eq('reg_no', credentials.id)
                .single();
            
            if (data) {
                localStorage.setItem('school_id', data.school_id);
                return { success: true, user: transformStudent(data) };
            }
        }
    } catch (e) {
        console.error("Login error", e);
    }
    return { success: false, message: "Invalid Credentials" };
  },

  // --- Classes Management ---
  
  createClass: async (name: string, teacherPassword: string, subjects: string[]) => {
    const schoolId = getSchoolId();
    if (!schoolId) return { success: false, message: "Session expired" };

    try {
        // Convert simple string array to SubjectConfig with default 100 marks
        const subjectConfigs: SubjectConfig[] = subjects.map(s => ({ name: s, maxMarks: 100 }));

        const { error } = await supabase.from('classes').insert([{
            school_id: schoolId,
            name,
            teacher_password: teacherPassword,
            subjects: JSON.stringify(subjectConfigs)
        }]);

        if (error) throw error;
        return { success: true };
    } catch (e: any) {
        return { success: false, message: e.message };
    }
  },

  getClasses: async () => {
    const schoolId = getSchoolId();
    if (!schoolId) return [];
    
    const { data } = await supabase.from('classes').select('*').eq('school_id', schoolId).order('name', { ascending: true });
    
    return data?.map(c => ({
        ...c,
        subjects: parseSubjects(c.subjects)
    })) || [];
  },

  updateClassSubjects: async (classId: string, subjects: SubjectConfig[]) => {
      const { error } = await supabase.from('classes').update({ 
          subjects: JSON.stringify(subjects) 
      }).eq('id', classId);
      return { success: !error, message: error?.message };
  },

  deleteClass: async (classId: string) => {
      const { error } = await supabase.from('classes').delete().eq('id', classId);
      return { success: !error, message: error?.message || "Class deleted" };
  },

  // --- Students Management ---

  addStudents: async (classId: string, students: { regNo: string, name: string, dob: string }[]) => {
      const schoolId = getSchoolId();
      if (!schoolId) return { success: false, message: "Session expired" };

      try {
          const payload = students.map(s => ({
              school_id: schoolId,
              class_id: classId,
              reg_no: s.regNo,
              name: s.name,
              dob: s.dob
          }));

          const { error } = await supabase.from('students').insert(payload);
          if (error) throw error;
          return { success: true };
      } catch (e: any) {
          return { success: false, message: e.message };
      }
  },

  getStudentsByClass: async (classId: string) => {
    const { data } = await supabase.from('students').select('*').eq('class_id', classId).order('reg_no', { ascending: true });
    return data?.map(transformStudent) || [];
  },

  // --- Marks ---
  getMarks: async (studentId: string, term: string) => {
    const { data } = await supabase
        .from('marks')
        .select('*')
        .eq('student_id', studentId)
        .eq('term', term)
        .single();
    
    if (data) return transformMarks(data);
    return null;
  },

  getClassMarks: async (studentIds: string[], term: string) => {
    if (studentIds.length === 0) return [];
    
    const { data } = await supabase
        .from('marks')
        .select('*')
        .in('student_id', studentIds)
        .eq('term', term);
        
    return data?.map(transformMarks) || [];
  },

  saveMarks: async (marks: Marks) => {
    const schoolId = getSchoolId();
    if (!schoolId) return { success: false };
    
    const { data: existing } = await supabase
        .from('marks')
        .select('id')
        .eq('student_id', marks.studentId)
        .eq('term', marks.term)
        .single();

    if (existing) {
        await supabase.from('marks').update({
            subjects: marks.subjects,
            total: marks.total,
            grade: marks.grade
        }).eq('id', existing.id);
    } else {
        await supabase.from('marks').insert([{
            school_id: schoolId,
            student_id: marks.studentId,
            term: marks.term,
            subjects: marks.subjects,
            total: marks.total,
            grade: marks.grade
        }]);
    }
    return { success: true };
  },

  // --- Profile Requests ---

  createProfileRequest: async (studentId: string, field: string, newValue: string) => {
      const schoolId = getSchoolId();
      if (!schoolId) return { success: false, message: "Session expired" };

      try {
          const { error } = await supabase.from('profile_requests').insert([{
              school_id: schoolId,
              student_id: studentId,
              field,
              new_value: newValue,
              status: 'PENDING'
          }]);
          if (error) throw error;
          return { success: true };
      } catch (e: any) {
          return { success: false, message: e.message };
      }
  },

  getStudentRequests: async (studentId: string) => {
      const { data } = await supabase.from('profile_requests').select('*').eq('student_id', studentId).order('created_at', { ascending: false });
      return (data || []).map((r: any) => ({
          id: r.id,
          studentId: r.student_id,
          field: r.field,
          newValue: r.new_value,
          status: r.status,
          createdAt: r.created_at
      }));
  },

  getPendingRequestsForClass: async (classId: string) => {
      // 1. Get all students in this class
      const students = await api.getStudentsByClass(classId);
      if (students.length === 0) return [];
      
      const studentIds = students.map(s => s.id);

      // 2. Get pending requests for these students
      const { data } = await supabase
          .from('profile_requests')
          .select('*')
          .in('student_id', studentIds)
          .eq('status', 'PENDING');
          
      if (!data) return [];

      // 3. Map back to include Student Name
      return data.map((r: any) => {
          const stu = students.find(s => s.id === r.student_id);
          return {
              id: r.id,
              studentId: r.student_id,
              studentName: stu?.name,
              regNo: stu?.regNo,
              field: r.field,
              newValue: r.new_value,
              status: r.status,
              createdAt: r.created_at
          } as ProfileRequest;
      });
  },

  resolveProfileRequest: async (request: ProfileRequest, action: 'APPROVED' | 'REJECTED') => {
      try {
          // 1. Update Request Status
          const { error: reqError } = await supabase
            .from('profile_requests')
            .update({ status: action })
            .eq('id', request.id);
            
          if (reqError) throw reqError;

          // 2. If Approved, Update Student Data
          if (action === 'APPROVED') {
              const dbField = request.field === 'fatherName' ? 'father_name' : 
                              request.field === 'motherName' ? 'mother_name' : 
                              request.field === 'dob' ? 'dob' : 'name';
              
              const { error: stuError } = await supabase
                .from('students')
                .update({ [dbField]: request.newValue })
                .eq('id', request.studentId);
                
              if (stuError) throw stuError;
          }
          return { success: true };
      } catch (e: any) {
          return { success: false, message: e.message };
      }
  },

  // --- Public Search ---
  publicSearch: async (regNo: string, dob: string) => {
    const { data: student } = await supabase
        .from('students')
        .select('*, schools(name)')
        .eq('reg_no', regNo)
        .eq('dob', dob)
        .single();

    if (!student) return null;

    const { data: marks } = await supabase
        .from('marks')
        .select('*')
        .eq('student_id', student.id)
        .eq('term', 'Term 1') // Default
        .single();

    return { 
        student: transformStudent(student), 
        marks: marks ? transformMarks(marks) : null 
    };
  },

  // --- Config & License ---
  getSchoolConfig: async () => {
      const schoolId = getSchoolId();
      if (!schoolId) return null;

      const { data } = await supabase.from('schools').select('*').eq('id', schoolId).single();
      if (!data) return null;
      
      return {
          schoolName: data.name,
          sheetUrl: '',
          licenseKey: data.license_key || 'FREE',
          isPro: data.is_pro || false,
          themeColor: 'indigo'
      };
  },

  activateLicense: async (key: string) => {
      const schoolId = getSchoolId();
      if (!schoolId) return { success: false };

      if (key.startsWith('PRO-')) {
          await supabase.from('schools').update({
              is_pro: true,
              license_key: key
          }).eq('id', schoolId);
          return { success: true, message: "Pro License Activated" };
      }
      return { success: false, message: "Invalid Key" };
  }
};

const transformStudent = (dbData: any): Student => ({
    id: dbData.id,
    regNo: dbData.reg_no,
    name: dbData.name,
    classId: dbData.class_id,
    dob: dbData.dob,
    fatherName: dbData.father_name || '',
    motherName: dbData.mother_name || '',
    photoUrl: dbData.photo_url
});

const transformMarks = (dbData: any): Marks => ({
    studentId: dbData.student_id,
    term: dbData.term,
    subjects: dbData.subjects,
    total: dbData.total,
    grade: dbData.grade
});