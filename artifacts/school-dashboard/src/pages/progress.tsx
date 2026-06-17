import { useState } from "react";
import { getStudents, getExamResults, getGrade, getPassingPercentage, ExamResult, EXAM_TYPES } from "@/lib/storage";
import { SearchableCombobox, ComboboxOption } from "@/components/searchable-combobox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, AreaChart, Area
} from "recharts";
import { TrendingUp, TrendingDown, UserCheck, BookOpen, AlertTriangle, Medal, Star, Trophy } from "lucide-react";

// Get latest result per subject for a given student + examType
function getLatestPerSubject(results: ExamResult[], studentId: string, examType: string): ExamResult[] {
  const filtered = results.filter(r => r.studentId === studentId && r.examType === examType);
  const subjectMap: Record<string, ExamResult> = {};
  filtered.forEach(r => {
    if (!subjectMap[r.subject] || new Date(r.date) > new Date(subjectMap[r.subject].date)) {
      subjectMap[r.subject] = r;
    }
  });
  return Object.values(subjectMap).sort((a, b) => a.subject.localeCompare(b.subject));
}

// Get class position for a specific exam type
function getClassPosition(studentId: string, cls: string, examType: string, allResults: ExamResult[]) {
  const classResults = allResults.filter(r => r.class === cls && r.examType === examType);
  const sumMap: Record<string, number> = {};
  const countMap: Record<string, number> = {};
  classResults.forEach(r => {
    const pct = (r.obtainedMarks / r.totalMarks) * 100;
    sumMap[r.studentId] = (sumMap[r.studentId] || 0) + pct;
    countMap[r.studentId] = (countMap[r.studentId] || 0) + 1;
  });
  const ranked = Object.entries(sumMap)
    .map(([id, sum]) => ({ id, avg: sum / countMap[id] }))
    .sort((a, b) => b.avg - a.avg);
  const rank = ranked.findIndex(s => s.id === studentId) + 1;
  return { rank: rank > 0 ? rank : null, total: ranked.length, top3: ranked.slice(0, 3) };
}

function getMonthDays(year: number, month: number): string[] {
  const days: string[] = [];
  const dim = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= dim; d++) days.push(new Date(year, month, d).toISOString().split("T")[0]);
  return days;
}

const RANK_ICONS: Record<number, string> = { 1: "🥇", 2: "🥈", 3: "🥉" };

// Subject Report Table Component
function SubjectReportTable({ rows, passingPct, position }: {
  rows: ExamResult[];
  passingPct: number;
  position: { rank: number | null; total: number; top3: { id: string; avg: number }[] };
}) {
  const students = getStudents();
  if (rows.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground">
        <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
        <p>No results recorded for this exam type yet.</p>
      </div>
    );
  }

  const totalObtained = rows.reduce((s, r) => s + r.obtainedMarks, 0);
  const totalMarks = rows.reduce((s, r) => s + r.totalMarks, 0);
  const overallPct = totalMarks > 0 ? Math.round((totalObtained / totalMarks) * 100) : 0;
  const overallGrade = getGrade(overallPct, passingPct);

  return (
    <div className="space-y-4">
      {/* Class Position Banner */}
      {position.rank !== null && (
        <div className="flex flex-col sm:flex-row gap-3">
          <div className={`flex-1 rounded-xl p-4 border text-center ${position.rank === 1 ? "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-700" : position.rank <= 3 ? "bg-slate-50 dark:bg-slate-900 border-slate-200" : "bg-card border-border"}`}>
            <div className="text-3xl mb-1">{RANK_ICONS[position.rank] || "🏅"}</div>
            <p className="text-2xl font-bold">{position.rank === 1 ? "1st" : position.rank === 2 ? "2nd" : position.rank === 3 ? "3rd" : `${position.rank}th`}</p>
            <p className="text-sm text-muted-foreground">out of {position.total} students</p>
          </div>
          {position.top3.length > 0 && (
            <Card className="flex-1">
              <CardHeader className="pb-2"><CardTitle className="text-xs text-muted-foreground">Top 3 in Class</CardTitle></CardHeader>
              <CardContent className="space-y-1 pt-0">
                {position.top3.map((s, i) => {
                  const stu = students.find(st => st.id === s.id);
                  return (
                    <div key={s.id} className="flex items-center justify-between text-sm">
                      <span>{RANK_ICONS[i + 1]} {stu?.name || "Unknown"}</span>
                      <Badge variant="outline">{Math.round(s.avg)}%</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Subject-wise Marks Table */}
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2.5 font-semibold">Subject</th>
              <th className="text-center px-4 py-2.5 font-semibold">Obtained</th>
              <th className="text-center px-4 py-2.5 font-semibold">Total</th>
              <th className="text-center px-4 py-2.5 font-semibold">%</th>
              <th className="text-center px-4 py-2.5 font-semibold">Grade</th>
              <th className="text-center px-4 py-2.5 font-semibold">Status</th>
              <th className="text-left px-4 py-2.5 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const pct = Math.round((r.obtainedMarks / r.totalMarks) * 100);
              const g = getGrade(pct, passingPct);
              return (
                <tr key={r.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-2.5 font-medium">{r.subject}</td>
                  <td className="px-4 py-2.5 text-center font-bold text-emerald-600">{r.obtainedMarks}</td>
                  <td className="px-4 py-2.5 text-center text-muted-foreground">{r.totalMarks}</td>
                  <td className="px-4 py-2.5 text-center font-semibold">{pct}%</td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge className={`${g.color} text-white text-xs`}>{g.grade}</Badge>
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <Badge variant={g.pass ? "outline" : "destructive"} className={g.pass ? "border-emerald-500 text-emerald-600 text-xs" : "text-xs"}>
                      {g.pass ? "Pass" : "Fail"}
                    </Badge>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground text-xs whitespace-nowrap">
                    {new Date(r.date + "T12:00:00").toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="border-t-2 bg-primary/5">
            <tr>
              <td className="px-4 py-3 font-bold text-primary">TOTAL</td>
              <td className="px-4 py-3 text-center font-bold text-emerald-600 text-base">{totalObtained}</td>
              <td className="px-4 py-3 text-center font-bold">{totalMarks}</td>
              <td className="px-4 py-3 text-center font-bold text-base">{overallPct}%</td>
              <td className="px-4 py-3 text-center">
                <Badge className={`${overallGrade.color} text-white`}>{overallGrade.grade}</Badge>
              </td>
              <td className="px-4 py-3 text-center">
                <Badge variant={overallGrade.pass ? "outline" : "destructive"} className={overallGrade.pass ? "border-emerald-500 text-emerald-600 font-bold" : "font-bold"}>
                  {overallGrade.pass ? "✓ Pass" : "✗ Fail"}
                </Badge>
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

export default function StudentProgress() {
  const [studentId, setStudentId] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const students = getStudents();
  const allResults = getExamResults();
  const passingPct = getPassingPercentage();
  const now = new Date();
  const monthDays = getMonthDays(now.getFullYear(), now.getMonth());

  const student = students.find(s => s.id === studentId);
  const studentResults = allResults.filter(r => r.studentId === studentId);

  const studentOptions: ComboboxOption[] = students.map(s => ({
    label: `${s.name} — Roll ${s.rollNumber} (${s.class})`,
    value: s.id,
  }));

  // Attendance
  const markedDays = student ? monthDays.filter(d => student.attendanceRecord[d]) : [];
  const presentDays = student ? monthDays.filter(d => student.attendanceRecord[d] === "present") : [];
  const attendancePct = markedDays.length > 0 ? Math.round((presentDays.length / markedDays.length) * 100) : null;

  // Overall avg
  const avgMarks = studentResults.length > 0
    ? Math.round(studentResults.reduce((acc, r) => acc + (r.obtainedMarks / r.totalMarks) * 100, 0) / studentResults.length)
    : null;

  // Subject performance
  const subjectMap: Record<string, number[]> = {};
  studentResults.forEach(r => {
    const pct = Math.round((r.obtainedMarks / r.totalMarks) * 100);
    if (!subjectMap[r.subject]) subjectMap[r.subject] = [];
    subjectMap[r.subject].push(pct);
  });
  const subjectData = Object.entries(subjectMap).map(([subject, pcts]) => ({
    subject,
    avg: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
    count: pcts.length,
  })).sort((a, b) => b.avg - a.avg);

  const strongSubjects = subjectData.filter(s => s.avg >= 80);
  const weakSubjects = subjectData.filter(s => s.avg < passingPct + 10);

  // Overall class rank
  const allClassmates = student ? students.filter(s => s.class === student.class) : [];
  const classPerfMap: Record<string, number> = {};
  allClassmates.forEach(s => {
    const sr = allResults.filter(r => r.studentId === s.id);
    if (sr.length > 0) classPerfMap[s.id] = sr.reduce((acc, r) => acc + (r.obtainedMarks / r.totalMarks) * 100, 0) / sr.length;
  });
  const sortedClass = Object.entries(classPerfMap).sort((a, b) => b[1] - a[1]);
  const overallRank = studentId ? sortedClass.findIndex(([id]) => id === studentId) + 1 : null;

  // Improvement rate
  let improvementRate: number | null = null;
  if (studentResults.length >= 4) {
    const sorted = [...studentResults].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const half = Math.floor(sorted.length / 2);
    const first = sorted.slice(0, half).reduce((acc, r) => acc + (r.obtainedMarks / r.totalMarks) * 100, 0) / half;
    const second = sorted.slice(half).reduce((acc, r) => acc + (r.obtainedMarks / r.totalMarks) * 100, 0) / (sorted.length - half);
    improvementRate = Math.round(second - first);
  }

  // Exam type trend chart
  const examTrendData = EXAM_TYPES.map(et => {
    const tr = studentResults.filter(r => r.examType === et.value);
    if (tr.length === 0) return null;
    const avg = Math.round(tr.reduce((acc, r) => acc + (r.obtainedMarks / r.totalMarks) * 100, 0) / tr.length);
    return { name: et.label.replace(" Test", ""), avg };
  }).filter(Boolean) as { name: string; avg: number }[];

  const getBarColor = (avg: number) => avg >= 80 ? "#10b981" : avg >= passingPct ? "#3b82f6" : "#ef4444";

  const tabs = [
    { key: "overview", label: "Overview" },
    ...EXAM_TYPES.map(et => ({ key: et.value, label: et.label.replace(" Test", "") }))
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Student Progress</h1>
        <p className="text-muted-foreground mt-1">Complete academic progress report with subject-wise marks and class ranking.</p>
      </div>

      {/* Student Search */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <label className="text-sm font-medium shrink-0">Search Student:</label>
            <SearchableCombobox
              options={studentOptions}
              value={studentId}
              onChange={v => { setStudentId(v); setActiveTab("overview"); }}
              placeholder="Type name or roll number..."
              className="max-w-md flex-1"
              data-testid="select-progress-student"
            />
          </div>
        </CardContent>
      </Card>

      {!student ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
          <TrendingUp className="h-12 w-12 opacity-20" />
          <p className="text-lg font-medium">Select a student to view their progress report</p>
          <p className="text-sm">Search by name or roll number above.</p>
        </div>
      ) : (
        <>
          {/* Student Banner */}
          <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white border-0">
            <CardContent className="pt-5 pb-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold">{student.name}</h2>
                  <p className="opacity-80 text-sm">Father: {student.fatherName} · Class {student.class} · Roll No {student.rollNumber}</p>
                  <p className="opacity-70 text-xs mt-0.5">Admission: {student.admissionDate} · DOB: {student.dateOfBirth} · {student.phone}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge className="bg-white/20 text-white text-sm px-3 py-1">
                    {student.feeStatus === "paid" ? "✅ Fee Paid" : "⚠️ Fee Pending"}
                  </Badge>
                  {overallRank !== null && overallRank > 0 && (
                    <Badge className="bg-amber-400/80 text-amber-900 text-sm px-3 py-1">
                      🏆 Rank #{overallRank} / {sortedClass.length}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  activeTab === t.key
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {t.label}
                {t.key !== "overview" && (() => {
                  const count = studentResults.filter(r => r.examType === t.key).length;
                  return count > 0 ? <span className={`ml-1 rounded-full px-1 text-xs ${activeTab === t.key ? "bg-white/20" : "bg-primary/10 text-primary"}`}>{count}</span> : null;
                })()}
              </button>
            ))}
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">Attendance</p>
                      <UserCheck className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className={`text-2xl font-bold ${attendancePct !== null ? (attendancePct >= 75 ? "text-emerald-600" : "text-red-500") : "text-muted-foreground"}`}>
                      {attendancePct !== null ? `${attendancePct}%` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{presentDays.length}/{markedDays.length} days this month</p>
                    {attendancePct !== null && <Progress value={attendancePct} className="mt-1.5 h-1.5" />}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">Overall Avg</p>
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className={`text-2xl font-bold ${avgMarks !== null ? (avgMarks >= passingPct ? "text-emerald-600" : "text-red-500") : "text-muted-foreground"}`}>
                      {avgMarks !== null ? `${avgMarks}%` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{studentResults.length} total results</p>
                    {avgMarks !== null && <Progress value={avgMarks} className="mt-1.5 h-1.5" />}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">Improvement</p>
                      <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className={`text-2xl font-bold ${improvementRate === null ? "text-muted-foreground" : improvementRate >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                      {improvementRate === null ? "—" : `${improvementRate > 0 ? "+" : ""}${improvementRate}%`}
                    </p>
                    <p className="text-xs text-muted-foreground">{improvementRate === null ? "Need ≥4 exams" : improvementRate >= 0 ? "📈 Improving" : "📉 Declining"}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-muted-foreground">Class Rank</p>
                      <Medal className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <p className={`text-2xl font-bold ${overallRank !== null && overallRank <= 3 ? "text-amber-500" : "text-foreground"}`}>
                      {overallRank !== null && overallRank > 0 ? `#${overallRank}` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{overallRank ? `of ${sortedClass.length} ranked` : "No results yet"}</p>
                  </CardContent>
                </Card>
              </div>

              {/* Strong / Weak */}
              {(strongSubjects.length > 0 || weakSubjects.length > 0) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {strongSubjects.length > 0 && (
                    <Card className="border-emerald-200 dark:border-emerald-800">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                          <Star className="h-4 w-4" /><CardTitle className="text-sm">Strong Subjects</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2 pt-0">
                        {strongSubjects.map(s => (
                          <div key={s.subject} className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950 rounded-lg px-3 py-1 border border-emerald-200 dark:border-emerald-800">
                            <span className="text-sm">{s.subject}</span>
                            <Badge className="bg-emerald-500 text-white text-xs">{s.avg}%</Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                  {weakSubjects.length > 0 && (
                    <Card className="border-amber-200 dark:border-amber-800">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="h-4 w-4" /><CardTitle className="text-sm">Needs Improvement</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="flex flex-wrap gap-2 pt-0">
                        {weakSubjects.map(s => (
                          <div key={s.subject} className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950 rounded-lg px-3 py-1 border border-amber-200 dark:border-amber-800">
                            <span className="text-sm">{s.subject}</span>
                            <Badge className="bg-amber-500 text-white text-xs">{s.avg}%</Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Charts */}
              {subjectData.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Performance by Subject</CardTitle></CardHeader>
                    <CardContent className="p-0 pb-2">
                      <div className="overflow-x-auto">
                        <div style={{ minWidth: Math.max(subjectData.length * 70, 280) + "px", height: 220 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subjectData} margin={{ left: 8, right: 8, top: 12 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                              <XAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={9} tickLine={false} axisLine={false} angle={-35} textAnchor="end" height={50} />
                              <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                                formatter={(val: number) => [`${val}%`, "Average"]} />
                              <Bar dataKey="avg" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  {examTrendData.length >= 2 && (
                    <Card>
                      <CardHeader><CardTitle className="text-sm">Score Trend by Exam Type</CardTitle></CardHeader>
                      <CardContent className="h-[220px] pl-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={examTrendData}>
                            <defs>
                              <linearGradient id="areaP" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} angle={-20} textAnchor="end" height={40} />
                            <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                              formatter={(v: number) => [`${v}%`, "Avg Score"]} />
                            <Area type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#areaP)" dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}

              {/* Progress Bars */}
              {subjectData.length > 0 && (
                <Card>
                  <CardHeader><CardTitle className="text-sm">Subject Progress Bars</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    {subjectData.map(s => {
                      const g = getGrade(s.avg, passingPct);
                      return (
                        <div key={s.subject} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="font-medium">{s.subject}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{s.count} test{s.count !== 1 ? "s" : ""}</span>
                              <Badge className={`${g.color} text-white text-xs px-1.5`}>{g.grade}</Badge>
                              <span className="text-muted-foreground text-sm">{s.avg}%</span>
                            </div>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${s.avg}%`, backgroundColor: getBarColor(s.avg) }} />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              )}

              {studentResults.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  <p>No exam results for this student yet.</p>
                  <p className="text-sm">Go to Academics to enter marks.</p>
                </div>
              )}
            </div>
          )}

          {/* EXAM TYPE TABS */}
          {EXAM_TYPES.map(et => {
            if (activeTab !== et.value) return null;
            const rows = getLatestPerSubject(studentResults, studentId, et.value);
            const position = getClassPosition(studentId, student.class, et.value, allResults);
            return (
              <div key={et.value} className="space-y-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">{et.label} — {student.name}</h2>
                </div>
                <SubjectReportTable rows={rows} passingPct={passingPct} position={position} />
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
