import { useState, useEffect } from "react";
import { getStudents, saveStudents, Student, CLASSES } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, LineChart, Line, AreaChart, Area
} from "recharts";
import { CheckCircle2, XCircle, Users, TrendingUp, CalendarDays } from "lucide-react";

function getToday() {
  return new Date().toISOString().split("T")[0];
}

function getLast14Days(): string[] {
  const days: string[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split("T")[0]);
  }
  return days;
}

function getMonthDays(year: number, month: number): string[] {
  const days: string[] = [];
  const dim = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= dim; d++) {
    days.push(new Date(year, month, d).toISOString().split("T")[0]);
  }
  return days;
}

function formatShortDate(iso: string): string {
  const d = new Date(iso + "T12:00:00");
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export default function Attendance() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classFilter, setClassFilter] = useState("One");
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [activeTab, setActiveTab] = useState<"mark" | "history">("mark");

  useEffect(() => { setStudents(getStudents()); }, []);

  const classStudents = students.filter(s => s.class === classFilter);
  const now = new Date(selectedDate + "T12:00:00");
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthDays = getMonthDays(year, month);
  const last14 = getLast14Days();

  // Today's stats
  const presentToday = classStudents.filter(s => s.attendanceRecord[selectedDate] === "present").length;
  const absentToday = classStudents.filter(s => s.attendanceRecord[selectedDate] === "absent").length;
  const unmarkedToday = classStudents.length - presentToday - absentToday;
  const attendancePctToday = classStudents.length > 0
    ? Math.round((presentToday / classStudents.length) * 100)
    : 0;

  // Monthly stats for class
  const getClassDayStat = (date: string) => {
    const present = classStudents.filter(s => s.attendanceRecord[date] === "present").length;
    const absent = classStudents.filter(s => s.attendanceRecord[date] === "absent").length;
    const marked = present + absent;
    return { present, absent, marked, pct: marked > 0 ? Math.round((present / marked) * 100) : null };
  };

  // Monthly attendance rate
  const monthlyStats = monthDays.map(d => {
    const stat = getClassDayStat(d);
    return { date: formatShortDate(d), present: stat.present, absent: stat.absent, pct: stat.pct ?? 0, marked: stat.marked };
  }).filter(d => d.marked > 0);

  // Last 14 days chart data
  const last14Data = last14.map(d => {
    const stat = getClassDayStat(d);
    return { date: formatShortDate(d), pct: stat.pct ?? 0, present: stat.present, absent: stat.absent, marked: stat.marked };
  });

  // Monthly average
  const monthlyAvg = monthlyStats.length > 0
    ? Math.round(monthlyStats.reduce((a, b) => a + b.pct, 0) / monthlyStats.length)
    : null;

  // Per-student monthly %
  const getStudentMonthly = (student: Student) => {
    const present = monthDays.filter(d => student.attendanceRecord[d] === "present").length;
    const marked = monthDays.filter(d => student.attendanceRecord[d]).length;
    return marked > 0 ? Math.round((present / marked) * 100) : null;
  };

  const toggleAttendance = (studentId: string) => {
    const updated = students.map(s => {
      if (s.id !== studentId) return s;
      const current = s.attendanceRecord[selectedDate];
      return {
        ...s,
        attendanceRecord: {
          ...s.attendanceRecord,
          [selectedDate]: current === "present" ? "absent" : "present",
        } as Record<string, "present" | "absent">,
      };
    });
    setStudents(updated);
    saveStudents(updated);
  };

  const markAll = (status: "present" | "absent") => {
    const updated = students.map(s => {
      if (s.class !== classFilter) return s;
      return {
        ...s,
        attendanceRecord: {
          ...s.attendanceRecord,
          [selectedDate]: status,
        } as Record<string, "present" | "absent">,
      };
    });
    setStudents(updated);
    saveStudents(updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
        <p className="text-muted-foreground mt-1">Mark daily attendance and view history analytics by class.</p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-card p-4 rounded-lg border">
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-full sm:w-[180px]" data-testid="select-attendance-class">
            <SelectValue placeholder="Select class" />
          </SelectTrigger>
          <SelectContent>
            {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          data-testid="input-attendance-date"
        />
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => markAll("present")} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            Mark All Present
          </Button>
          <Button size="sm" variant="destructive" onClick={() => markAll("absent")}>
            Mark All Absent
          </Button>
        </div>
      </div>

      {/* Class Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Total Students</p>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-2xl font-bold text-blue-600">{classStudents.length}</p>
            <p className="text-xs text-muted-foreground">in Class {classFilter}</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Present Today</p>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">{presentToday}</p>
            <p className="text-xs text-muted-foreground">{selectedDate}</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Absent Today</p>
              <XCircle className="h-4 w-4 text-red-500" />
            </div>
            <p className="text-2xl font-bold text-red-500">{absentToday}</p>
            <p className="text-xs text-muted-foreground">{unmarkedToday} not marked</p>
          </CardContent>
        </Card>
        <Card className={attendancePctToday >= 75 ? "border-emerald-200 dark:border-emerald-800" : "border-amber-200 dark:border-amber-800"}>
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground">Today's Rate</p>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className={`text-2xl font-bold ${attendancePctToday >= 75 ? "text-emerald-600" : "text-amber-500"}`}>
              {presentToday + absentToday > 0 ? `${attendancePctToday}%` : "—"}
            </p>
            {monthlyAvg !== null && <p className="text-xs text-muted-foreground">Month avg: {monthlyAvg}%</p>}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ key: "mark", label: "Mark Attendance" }, { key: "history", label: "History & Analytics" }].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
              activeTab === t.key
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "mark" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Class {classFilter} — {new Date(selectedDate + "T12:00:00").toLocaleDateString("en-PK", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Monthly %</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classStudents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        No students in Class {classFilter}. Add students first.
                      </TableCell>
                    </TableRow>
                  ) : (
                    classStudents.map(student => {
                      const status = student.attendanceRecord[selectedDate];
                      const monthly = getStudentMonthly(student);
                      return (
                        <TableRow key={student.id} data-testid={`row-attendance-${student.id}`}>
                          <TableCell className="font-medium">{student.rollNumber}</TableCell>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell>
                            {status === "present" ? (
                              <Badge className="bg-emerald-500 text-white gap-1"><CheckCircle2 className="h-3 w-3" /> Present</Badge>
                            ) : status === "absent" ? (
                              <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Absent</Badge>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Not Marked</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {monthly !== null ? (
                              <div className="flex items-center gap-2">
                                <span className={`font-medium text-sm ${monthly >= 75 ? "text-emerald-600" : "text-red-500"}`}>{monthly}%</span>
                                <Progress value={monthly} className="w-16 h-1.5" />
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">No data</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              onClick={() => toggleAttendance(student.id)}
                              className={status === "present" ? "bg-red-500 hover:bg-red-600 text-white" : status === "absent" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
                              variant={!status ? "outline" : "default"}
                              data-testid={`button-toggle-attendance-${student.id}`}
                            >
                              {status === "present" ? "Mark Absent" : "Mark Present"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Last 14 Days Bar Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-primary" />
                <CardTitle className="text-base">Last 14 Days — Class {classFilter} Attendance Rate</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="h-[220px] pl-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last14Data} margin={{ left: 8, right: 8, top: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    formatter={(val: number, name: string) => [name === "pct" ? `${val}%` : val, name === "pct" ? "Attendance %" : name]}
                  />
                  <Bar dataKey="pct" name="pct" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Monthly trend line */}
          {monthlyStats.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Attendance Trend — {now.toLocaleString("default", { month: "long", year: "numeric" })}</CardTitle>
              </CardHeader>
              <CardContent className="h-[200px] pl-0">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyStats}>
                    <defs>
                      <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 100]} stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                      formatter={(v: number) => [`${v}%`, "Attendance Rate"]}
                    />
                    <Area type="monotone" dataKey="pct" stroke="#10b981" strokeWidth={2} fill="url(#attGrad)" dot={{ r: 3 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Per-student history table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Student-wise Monthly Summary — Class {classFilter}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Roll No</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Days Present</TableHead>
                      <TableHead>Days Absent</TableHead>
                      <TableHead>Days Marked</TableHead>
                      <TableHead>Monthly %</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {classStudents.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No students in this class.
                        </TableCell>
                      </TableRow>
                    ) : (
                      classStudents.map(student => {
                        const present = monthDays.filter(d => student.attendanceRecord[d] === "present").length;
                        const absent = monthDays.filter(d => student.attendanceRecord[d] === "absent").length;
                        const marked = present + absent;
                        const pct = marked > 0 ? Math.round((present / marked) * 100) : null;
                        return (
                          <TableRow key={student.id}>
                            <TableCell className="font-medium">{student.rollNumber}</TableCell>
                            <TableCell className="font-medium">{student.name}</TableCell>
                            <TableCell className="text-emerald-600 font-medium">{present}</TableCell>
                            <TableCell className="text-red-500 font-medium">{absent}</TableCell>
                            <TableCell className="text-muted-foreground">{marked}</TableCell>
                            <TableCell>
                              {pct !== null ? (
                                <div className="flex items-center gap-2">
                                  <span className={`font-bold ${pct >= 75 ? "text-emerald-600" : "text-red-500"}`}>{pct}%</span>
                                  <Progress value={pct} className="w-16 h-1.5" />
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-sm">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {pct === null ? <Badge variant="outline">No Data</Badge>
                                : pct >= 75 ? <Badge className="bg-emerald-500 text-white">Regular</Badge>
                                : pct >= 50 ? <Badge className="bg-amber-500 text-white">Irregular</Badge>
                                : <Badge variant="destructive">Shortage</Badge>}
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
