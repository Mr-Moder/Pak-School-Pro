export type Student = {
  id: string;
  name: string;
  fatherName: string;
  class: string;
  rollNumber: string;
  phone: string;
  address: string;
  admissionDate: string;
  dateOfBirth: string;
  feeStatus: "paid" | "pending";
  attendanceRecord: Record<string, "present" | "absent">;
  examMarks: Record<string, number>;
};

export type Teacher = {
  id: string;
  name: string;
  subject: string;
  phone: string;
  qualification: string;
  joiningDate: string;
  attendanceRecord: Record<string, "present" | "absent">;
  classPerformance: number;
};

export type ExamResult = {
  id: string;
  studentId: string;
  studentName: string;
  class: string;
  subject: string;
  examType: string;
  examTitle: string;
  date: string;
  totalMarks: number;
  obtainedMarks: number;
  passingPercentage: number;
};

export type Exam = {
  id: string;
  title: string;
  type: string;
  classes: string[];
  subjects: string[];
  dateFrom: string;
  dateTill: string;
  instructions: string;
};

export const CLASSES = [
  "Play Group", "Nursery", "Prep", "One", "Two", "Three", "Four", "Five",
  "Six", "Seven", "Eight", "Ninth", "Tenth", "First Year", "Second Year"
];

export const SUBJECTS = [
  "Urdu", "English", "Mathematics", "Science", "Islamiat",
  "Social Studies", "Computer", "Physics", "Chemistry", "Biology",
  "Pakistan Studies", "General Knowledge", "Tarjma-tul-Quran", "Economics"
];

export const EXAM_TYPES = [
  { value: "daily", label: "Daily Test" },
  { value: "weekly", label: "Weekly Test" },
  { value: "monthly", label: "Monthly Test" },
  { value: "quarter1", label: "Quarter Test 1" },
  { value: "quarter2", label: "Quarter Test 2" },
  { value: "quarter3", label: "Quarter Test 3" },
  { value: "quarter4", label: "Quarter Test 4" },
  { value: "halfbook", label: "Half Book Test" },
  { value: "fullbook", label: "Full Book Test" },
];

const INITIAL_STUDENTS: Student[] = [
  { id: "1", name: "Ali Khan", fatherName: "Tariq Khan", class: "Ninth", rollNumber: "901", phone: "03001234567", address: "Lahore", admissionDate: "2023-08-01", dateOfBirth: "2008-05-12", feeStatus: "paid", attendanceRecord: {}, examMarks: {} },
  { id: "2", name: "Fatima Ahmed", fatherName: "Ahmed Raza", class: "Tenth", rollNumber: "1001", phone: "03007654321", address: "Karachi", admissionDate: "2022-08-01", dateOfBirth: "2007-11-23", feeStatus: "pending", attendanceRecord: {}, examMarks: {} },
  { id: "3", name: "Usman Tariq", fatherName: "Tariq Mehmood", class: "Eight", rollNumber: "801", phone: "03331234567", address: "Islamabad", admissionDate: "2024-08-01", dateOfBirth: "2009-02-15", feeStatus: "paid", attendanceRecord: {}, examMarks: {} },
  { id: "4", name: "Ayesha Bibi", fatherName: "Muhammad Asif", class: "First Year", rollNumber: "1101", phone: "03211234567", address: "Rawalpindi", admissionDate: "2024-08-01", dateOfBirth: "2006-03-10", feeStatus: "paid", attendanceRecord: {}, examMarks: {} },
  { id: "5", name: "Hamza Malik", fatherName: "Zafar Malik", class: "Seven", rollNumber: "701", phone: "03451234567", address: "Lahore", admissionDate: "2024-08-01", dateOfBirth: "2010-07-22", feeStatus: "pending", attendanceRecord: {}, examMarks: {} },
];

const INITIAL_TEACHERS: Teacher[] = [
  { id: "1", name: "Sarah Zafar", subject: "Mathematics", phone: "03001112233", qualification: "MSc Mathematics", joiningDate: "2019-01-10", attendanceRecord: {}, classPerformance: 85 },
  { id: "2", name: "Kamran Shah", subject: "Physics", phone: "03004445566", qualification: "MSc Physics", joiningDate: "2020-03-15", attendanceRecord: {}, classPerformance: 92 },
  { id: "3", name: "Nadia Iqbal", subject: "English", phone: "03009998877", qualification: "MA English", joiningDate: "2021-06-01", attendanceRecord: {}, classPerformance: 88 },
];

// Students
export function getStudents(): Student[] {
  const data = localStorage.getItem("school_students");
  return data ? JSON.parse(data) : INITIAL_STUDENTS;
}
export function saveStudents(students: Student[]) {
  localStorage.setItem("school_students", JSON.stringify(students));
}

// Cascade delete: removes student + all their exam results
export function deleteStudentCompletely(studentId: string): { examResultsRemoved: number } {
  const students = getStudents().filter(s => s.id !== studentId);
  saveStudents(students);
  const allResults = getExamResults();
  const remaining = allResults.filter(r => r.studentId !== studentId);
  const examResultsRemoved = allResults.length - remaining.length;
  saveExamResults(remaining);
  return { examResultsRemoved };
}

// Teachers
export function getTeachers(): Teacher[] {
  const data = localStorage.getItem("school_teachers");
  return data ? JSON.parse(data) : INITIAL_TEACHERS;
}
export function saveTeachers(teachers: Teacher[]) {
  localStorage.setItem("school_teachers", JSON.stringify(teachers));
}

// Exam Results
export function getExamResults(): ExamResult[] {
  const data = localStorage.getItem("school_exam_results");
  return data ? JSON.parse(data) : [];
}
export function saveExamResults(results: ExamResult[]) {
  localStorage.setItem("school_exam_results", JSON.stringify(results));
}

// Exams (predefined) - with migration from old format
export function getExams(): Exam[] {
  const data = localStorage.getItem("school_exams");
  if (!data) return [];
  const raw = JSON.parse(data) as any[];
  return raw.map(e => ({
    id: e.id,
    title: e.title,
    type: e.type,
    classes: e.classes || (e.class ? [e.class] : []),
    subjects: e.subjects || (e.subject ? [e.subject] : []),
    dateFrom: e.dateFrom || e.date || "",
    dateTill: e.dateTill || e.date || "",
    instructions: e.instructions || "",
  }));
}
export function saveExams(exams: Exam[]) {
  localStorage.setItem("school_exams", JSON.stringify(exams));
}

// Auth & Security
export function getPassword(): string {
  return localStorage.getItem("school_password") || "admin123";
}
export function savePassword(p: string) {
  localStorage.setItem("school_password", p);
}
export function getUsername(): string {
  return localStorage.getItem("school_username") || "admin";
}
export function saveUsername(u: string) {
  localStorage.setItem("school_username", u);
}

// Passing percentage
export function getPassingPercentage(): number {
  return parseInt(localStorage.getItem("school_passing_pct") || "33", 10);
}
export function savePassingPercentage(pct: number) {
  localStorage.setItem("school_passing_pct", String(pct));
}

// Login security
export function getLoginAttempts(): number {
  return parseInt(localStorage.getItem("school_login_attempts") || "0", 10);
}
export function getLockoutUntil(): number {
  return parseInt(localStorage.getItem("school_lockout_until") || "0", 10);
}
export function recordFailedAttempt() {
  const attempts = getLoginAttempts() + 1;
  localStorage.setItem("school_login_attempts", String(attempts));
  if (attempts >= 5) {
    localStorage.setItem("school_lockout_until", String(Date.now() + 15 * 60 * 1000));
    localStorage.setItem("school_login_attempts", "0");
  }
}
export function resetLoginAttempts() {
  localStorage.removeItem("school_login_attempts");
  localStorage.removeItem("school_lockout_until");
}

// Grade helper
export function getGrade(pct: number, passingPct: number): { grade: string; label: string; color: string; pass: boolean } {
  if (pct >= 90) return { grade: "A+", label: "Excellent", color: "bg-emerald-500", pass: true };
  if (pct >= 80) return { grade: "A", label: "Very Good", color: "bg-emerald-400", pass: true };
  if (pct >= 70) return { grade: "B", label: "Good", color: "bg-blue-500", pass: true };
  if (pct >= 60) return { grade: "C", label: "Average", color: "bg-amber-500", pass: true };
  if (pct >= passingPct) return { grade: "D", label: "Pass", color: "bg-orange-400", pass: true };
  return { grade: "F", label: "Fail", color: "bg-red-500", pass: false };
}

// ─── Announcements ─────────────────────────────────────────────────────────

export type Announcement = {
  id: string;
  title: string;
  message: string;
  image?: string;      // base64 data-url
  createdAt: number;   // Unix ms
};

export const ANNOUNCEMENT_TTL_MS = 25 * 60 * 60 * 1000; // 25 hours
export const MAX_ANNOUNCEMENTS = 5;

function purgeExpired(list: Announcement[]): Announcement[] {
  const now = Date.now();
  return list.filter(a => now - a.createdAt < ANNOUNCEMENT_TTL_MS);
}

export function getAnnouncements(): Announcement[] {
  const data = localStorage.getItem("school_announcements");
  if (!data) return [];
  const all: Announcement[] = JSON.parse(data);
  const valid = purgeExpired(all);
  if (valid.length !== all.length) {
    localStorage.setItem("school_announcements", JSON.stringify(valid));
  }
  return valid.sort((a, b) => b.createdAt - a.createdAt);
}

export function saveAnnouncements(list: Announcement[]) {
  localStorage.setItem("school_announcements", JSON.stringify(list));
}

export function addAnnouncement(
  data: Pick<Announcement, "title" | "message" | "image">
): { ok: boolean; error?: string } {
  const existing = getAnnouncements();
  if (existing.length >= MAX_ANNOUNCEMENTS) {
    return { ok: false, error: `Maximum ${MAX_ANNOUNCEMENTS} announcements allowed. Delete one first.` };
  }
  const newA: Announcement = { ...data, id: Date.now().toString(), createdAt: Date.now() };
  saveAnnouncements([newA, ...existing]);
  return { ok: true };
}

export function updateAnnouncement(
  id: string,
  updates: Partial<Pick<Announcement, "title" | "message" | "image">>
) {
  const list = getAnnouncements();
  saveAnnouncements(list.map(a => (a.id === id ? { ...a, ...updates } : a)));
}

export function deleteAnnouncement(id: string) {
  saveAnnouncements(getAnnouncements().filter(a => a.id !== id));
}

// ─────────────────────────────────────────────────────────────────────────────

export function initializeStorage() {
  if (!localStorage.getItem("school_students")) saveStudents(INITIAL_STUDENTS);
  if (!localStorage.getItem("school_teachers")) saveTeachers(INITIAL_TEACHERS);
  if (!localStorage.getItem("school_password")) localStorage.setItem("school_password", "admin123");
  if (!localStorage.getItem("school_username")) localStorage.setItem("school_username", "admin");
  if (!localStorage.getItem("school_passing_pct")) localStorage.setItem("school_passing_pct", "33");
}
