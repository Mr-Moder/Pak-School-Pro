import { useEffect, useState } from "react";
import { getStudents, getTeachers, getExamResults, getPassingPercentage, Student, Teacher, ExamResult, CLASSES, EXAM_TYPES } from "@/lib/storage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Users, GraduationCap, CreditCard, BookOpen, Trophy, TrendingUp,
  Medal, Award, School
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, LineChart, Line, Legend, AreaChart, Area
} from "recharts";

const MEDAL_COLORS = ["#f59e0b", "#94a3b8", "#d97706"];
const MEDAL_ICONS = ["🥇", "🥈", "🥉"];
const MEDAL_LABELS = ["1st", "2nd", "3rd"];
const MEDAL_BG = ["from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-700",
                   "from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border-slate-200 dark:border-slate-700",
                   "from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-700"];

export default function Dashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [passingPct, setPassingPct] = useState(33);
  const [activeExamType, setActiveExamType] = useState("monthly");
  const [activeClassTab, setActiveClassTab] = useState("all");

  useEffect(() => {
    setStudents(getStudents());
    setTeachers(getTeachers());
    setResults(getExamResults());
    setPassingPct(getPassingPercentage());
  }, []);

  const paidCount = students.filter(s => s.feeStatus === "paid").length;
  const pendingCount = students.filter(s => s.feeStatus === "pending").length;

  const feeData = [
    { name: "Paid", value: paidCount, color: "#10b981" },
    { name: "Pending", value: pendingCount, color: "#ef4444" },
  ];

  const classEnrollData = CLASSES.map(c => ({
    name: c, students: students.filter(s => s.class === c).length
  })).filter(c => c.students > 0);

  // ── Top Performers per class ──
  function getTopPerformers(examType: string) {
    const typeResults = results.filter(r => r.examType === examType);
    const classesWithData = CLASSES.filter(cls =>
      typeResults.some(r => r.class === cls)
    );
    return classesWithData.map(cls => {
      const classResults = typeResults.filter(r => r.class === cls);
      const studentMap: Record<string, { name: string; rollNumber: string; pcts: number[] }> = {};
      classResults.forEach(r => {
        if (!studentMap[r.studentId]) {
          const stu = students.find(s => s.id === r.studentId);
          studentMap[r.studentId] = { name: r.studentName, rollNumber: stu?.rollNumber || "", pcts: [] };
        }
        studentMap[r.studentId].pcts.push(Math.round((r.obtainedMarks / r.totalMarks) * 100));
      });
      const ranked = Object.values(studentMap)
        .map(s => ({ ...s, avg: Math.round(s.pcts.reduce((a, b) => a + b, 0) / s.pcts.length) }))
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 3);
      return { class: cls, top: ranked };
    }).filter(c => c.top.length > 0);
  }

  // ── Class Performance Analytics ──
  function getClassAnalytics() {
    return CLASSES.map(cls => {
      const classResults = results.filter(r => r.class === cls);
      if (classResults.length === 0) return null;
      const avgPct = Math.round(classResults.reduce((acc, r) => acc + (r.obtainedMarks / r.totalMarks) * 100, 0) / classResults.length);
      const passCount = classResults.filter(r => (r.obtainedMarks / r.totalMarks) * 100 >= passingPct).length;
      const passRate = Math.round((passCount / classResults.length) * 100);

      // Subject performance
      const subMap: Record<string, number[]> = {};
      classResults.forEach(r => {
        const pct = (r.obtainedMarks / r.totalMarks) * 100;
        if (!subMap[r.subject]) subMap[r.subject] = [];
        subMap[r.subject].push(pct);
      });
      const subAvgs = Object.entries(subMap).map(([s, pcts]) => ({ subject: s, avg: Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) }));
      const bestSub = subAvgs.sort((a, b) => b.avg - a.avg)[0];
      const weakSub = subAvgs[subAvgs.length - 1];

      // Attendance
      const classStudents = students.filter(s => s.class === cls);
      let totalMarked = 0, totalPresent = 0;
      classStudents.forEach(s => {
        const days = Object.keys(s.attendanceRecord);
        totalMarked += days.length;
        totalPresent += days.filter(d => s.attendanceRecord[d] === "present").length;
      });
      const attPct = totalMarked > 0 ? Math.round((totalPresent / totalMarked) * 100) : null;

      return { class: cls, avgPct, passRate, failRate: 100 - passRate, bestSub: bestSub?.subject, weakSub: weakSub?.subject, attPct, total: classResults.length };
    }).filter(Boolean) as {
      class: string; avgPct: number; passRate: number; failRate: number;
      bestSub?: string; weakSub?: string; attPct: number | null; total: number;
    }[];
  }

  const topPerformers = getTopPerformers(activeExamType);
  const classAnalytics = getClassAnalytics();

  // Overall school stats
  const schoolAvg = results.length > 0
    ? Math.round(results.reduce((acc, r) => acc + (r.obtainedMarks / r.totalMarks) * 100, 0) / results.length)
    : null;
  const bestClass = classAnalytics.sort((a, b) => b.avgPct - a.avgPct)[0];
  const weakClass = [...classAnalytics].sort((a, b) => a.avgPct - b.avgPct)[0];
  const bestAttClass = [...classAnalytics].filter(c => c.attPct !== null).sort((a, b) => (b.attPct || 0) - (a.attPct || 0))[0];

  // Exam type performance trend for overview chart
  const examTrendData = EXAM_TYPES.map(et => {
    const typeResults = results.filter(r => r.examType === et.value);
    if (typeResults.length === 0) return null;
    const avg = Math.round(typeResults.reduce((acc, r) => acc + (r.obtainedMarks / r.totalMarks) * 100, 0) / typeResults.length);
    return { name: et.label.replace(" Test", ""), avg };
  }).filter(Boolean) as { name: string; avg: number }[];

  // Class performance bar data
  const classPerformanceData = classAnalytics.map(c => ({ name: c.class, avg: c.avgPct, pass: c.passRate }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Oxford Science Public School & College — Overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[
          { title: "Total Students", value: students.length, icon: Users, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950" },
          { title: "Total Teachers", value: teachers.length, icon: GraduationCap, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950" },
          { title: "Active Classes", value: `${classEnrollData.length}/${CLASSES.length}`, icon: BookOpen, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950" },
          { title: "Fee Pending", value: pendingCount, icon: CreditCard, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950" },
        ].map(({ title, value, icon: Icon, color, bg }) => (
          <Card key={title} className="overflow-hidden">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">{title}</p>
                  <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
                </div>
                <div className={`${bg} ${color} rounded-xl p-3`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Overall School Performance Banner */}
      {schoolAvg !== null && (
        <Card className="bg-gradient-to-r from-blue-600 to-blue-800 text-white border-0">
          <CardContent className="pt-5 pb-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 rounded-xl p-3">
                  <School className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-blue-100 text-sm">Overall School Performance</p>
                  <p className="text-3xl font-bold">{schoolAvg}% Average</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                {bestClass && (
                  <div className="text-center">
                    <p className="text-blue-200">Best Class</p>
                    <p className="font-bold">{bestClass.class} ({bestClass.avgPct}%)</p>
                  </div>
                )}
                {weakClass && weakClass.class !== bestClass?.class && (
                  <div className="text-center">
                    <p className="text-blue-200">Needs Attention</p>
                    <p className="font-bold">{weakClass.class} ({weakClass.avgPct}%)</p>
                  </div>
                )}
                {bestAttClass && (
                  <div className="text-center">
                    <p className="text-blue-200">Best Attendance</p>
                    <p className="font-bold">{bestAttClass.class} ({bestAttClass.attPct}%)</p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Students by Class - scrollable */}
        <Card>
          <CardHeader><CardTitle className="text-base">Students by Class</CardTitle></CardHeader>
          <CardContent className="p-0 pb-2">
            <div className="overflow-x-auto">
              <div style={{ minWidth: Math.max(classEnrollData.length * 55, 300) + "px", height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classEnrollData} margin={{ left: 8, right: 8, top: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={40} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                    <Bar dataKey="students" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Fee Status */}
        <Card>
          <CardHeader><CardTitle className="text-base">Fee Status</CardTitle></CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={feeData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={5} dataKey="value">
                    {feeData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6">
              {feeData.map((e, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: e.color }} />
                  <span className="text-sm text-muted-foreground">{e.name} <strong className="text-foreground">({e.value})</strong></span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Exam Performance Trend */}
      {examTrendData.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">School-wide Exam Performance Trend</CardTitle></CardHeader>
          <CardContent className="h-[220px] pl-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={examTrendData}>
                <defs>
                  <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                  formatter={(v: number) => [`${v}%`, "Avg Score"]} />
                <Area type="monotone" dataKey="avg" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#avgGrad)" dot={{ r: 4, fill: "hsl(var(--primary))" }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Performers */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-bold">Top Performers</h2>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {EXAM_TYPES.map(et => (
              <button
                key={et.value}
                onClick={() => setActiveExamType(et.value)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors border ${
                  activeExamType === et.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {et.label}
              </button>
            ))}
          </div>
        </div>

        {topPerformers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Trophy className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p>No exam results recorded yet for {EXAM_TYPES.find(e => e.value === activeExamType)?.label}.</p>
              <p className="text-sm mt-1">Enter marks in the Academics section to see top performers here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {topPerformers.map(({ class: cls, top }) => (
              <Card key={cls} className="overflow-hidden">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Medal className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm font-bold">Class {cls}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 space-y-3">
                  {top.map((s, i) => (
                    <div key={i} className={`flex items-center gap-3 p-2 rounded-lg border bg-gradient-to-r ${MEDAL_BG[i]}`}>
                      <div className="text-2xl">{MEDAL_ICONS[i]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground">Roll: {s.rollNumber}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-base" style={{ color: MEDAL_COLORS[i] }}>{s.avg}%</p>
                        <Badge variant="outline" className="text-xs px-1">{MEDAL_LABELS[i]}</Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Class Performance Analytics */}
      {classAnalytics.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-bold">Class Performance Analytics</h2>
          </div>

          {/* Bar chart - scrollable */}
          <Card className="mb-4">
            <CardHeader><CardTitle className="text-sm">Average Score by Class</CardTitle></CardHeader>
            <CardContent className="p-0 pb-2">
              <div className="overflow-x-auto">
                <div style={{ minWidth: Math.max(classAnalytics.length * 80, 400) + "px", height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={classPerformanceData} margin={{ left: 8, right: 8, top: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} angle={-30} textAnchor="end" height={40} />
                      <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                        formatter={(v: number) => [`${v}%`]} />
                      <Legend />
                      <Bar dataKey="avg" name="Avg Score %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="pass" name="Pass Rate %" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Class cards grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classAnalytics.slice(0, 9).map(c => (
              <Card key={c.class} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold">Class {c.class}</h3>
                    <Badge className={c.avgPct >= 70 ? "bg-emerald-500 text-white" : c.avgPct >= passingPct ? "bg-amber-500 text-white" : "bg-red-500 text-white"}>
                      {c.avgPct}%
                    </Badge>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Pass Rate</span>
                      <span className="font-medium text-emerald-600">{c.passRate}%</span>
                    </div>
                    <Progress value={c.passRate} className="h-1.5" />
                    {c.attPct !== null && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Attendance</span>
                          <span className="font-medium">{c.attPct}%</span>
                        </div>
                        <Progress value={c.attPct} className="h-1.5" />
                      </>
                    )}
                    <div className="flex justify-between pt-1">
                      <div>
                        <span className="text-muted-foreground">Best: </span>
                        <span className="text-emerald-600 font-medium">{c.bestSub || "—"}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Weak: </span>
                        <span className="text-red-500 font-medium">{c.weakSub || "—"}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
