import { useState, useEffect } from "react";
import { getStudents, getExamResults, saveExamResults, getPassingPercentage, savePassingPercentage, getGrade, CLASSES, SUBJECTS, EXAM_TYPES, ExamResult } from "@/lib/storage";
import { SearchableCombobox, ComboboxOption } from "@/components/searchable-combobox";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Trash2, Edit2, BookOpen, Settings2, Calculator } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Academics() {
  const { toast } = useToast();
  const [results, setResults] = useState<ExamResult[]>([]);
  const [passingPct, setPassingPct] = useState(33);
  const [passingInput, setPassingInput] = useState("33");
  const [filterClass, setFilterClass] = useState("all");
  const [filterExamType, setFilterExamType] = useState("all");

  // Form state
  const [selClass, setSelClass] = useState("");
  const [selStudent, setSelStudent] = useState("");
  const [selSubject, setSelSubject] = useState("");
  const [selExamType, setSelExamType] = useState("");
  const [examTitle, setExamTitle] = useState("");
  const [examDate, setExamDate] = useState(new Date().toISOString().split("T")[0]);
  const [totalMarks, setTotalMarks] = useState("100");
  const [obtainedMarks, setObtainedMarks] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const students = getStudents();

  // Searchable options
  const classOptions: ComboboxOption[] = CLASSES.map(c => ({ label: c, value: c }));
  const subjectOptions: ComboboxOption[] = SUBJECTS.map(s => ({ label: s, value: s }));
  const examTypeOptions: ComboboxOption[] = EXAM_TYPES.map(e => ({ label: e.label, value: e.value }));

  // Student options: filter by class if selected, searchable by name OR roll number
  const classStudents = selClass ? students.filter(s => s.class === selClass) : students;
  const studentOptions: ComboboxOption[] = classStudents.map(s => ({
    label: `${s.name} — Roll ${s.rollNumber} (${s.class})`,
    value: s.id,
  }));

  useEffect(() => {
    setResults(getExamResults());
    const pct = getPassingPercentage();
    setPassingPct(pct);
    setPassingInput(String(pct));
  }, []);

  // When class changes, clear student
  const handleClassChange = (v: string) => {
    setSelClass(v);
    setSelStudent("");
  };

  const percentage = totalMarks && obtainedMarks
    ? Math.round((parseFloat(obtainedMarks) / parseFloat(totalMarks)) * 100)
    : null;
  const gradeInfo = percentage !== null ? getGrade(percentage, passingPct) : null;

  const savePassingPct = () => {
    const val = parseInt(passingInput, 10);
    if (isNaN(val) || val < 1 || val > 99) return;
    setPassingPct(val);
    savePassingPercentage(val);
    toast({ title: "Passing percentage updated", description: `Now set to ${val}%` });
  };

  const handleSubmit = () => {
    const student = students.find(s => s.id === selStudent);
    if (!student || !selSubject || !selExamType || !totalMarks || !obtainedMarks) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }
    const total = parseFloat(totalMarks);
    const obtained = parseFloat(obtainedMarks);
    if (obtained > total) {
      toast({ title: "Invalid marks", description: "Obtained marks cannot exceed total marks.", variant: "destructive" });
      return;
    }
    const result: ExamResult = {
      id: editingId || Date.now().toString(),
      studentId: student.id,
      studentName: student.name,
      class: student.class,
      subject: selSubject,
      examType: selExamType,
      examTitle: examTitle || EXAM_TYPES.find(e => e.value === selExamType)?.label || selExamType,
      date: examDate,
      totalMarks: total,
      obtainedMarks: obtained,
      passingPercentage: passingPct,
    };
    let updated: ExamResult[];
    if (editingId) {
      updated = results.map(r => r.id === editingId ? result : r);
      setEditingId(null);
      toast({ title: "Result updated successfully" });
    } else {
      updated = [result, ...results];
      toast({ title: "Result saved successfully" });
    }
    setResults(updated);
    saveExamResults(updated);
    setObtainedMarks("");
    setExamTitle("");
  };

  const handleEdit = (r: ExamResult) => {
    const student = students.find(s => s.id === r.studentId);
    if (student) { setSelClass(student.class); setSelStudent(r.studentId); }
    setSelSubject(r.subject);
    setSelExamType(r.examType);
    setExamTitle(r.examTitle);
    setExamDate(r.date);
    setTotalMarks(String(r.totalMarks));
    setObtainedMarks(String(r.obtainedMarks));
    setEditingId(r.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this result?")) return;
    const updated = results.filter(r => r.id !== id);
    setResults(updated);
    saveExamResults(updated);
  };

  const filtered = results.filter(r => {
    const matchClass = filterClass === "all" || r.class === filterClass;
    const matchExam = filterExamType === "all" || r.examType === filterExamType;
    return matchClass && matchExam;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Academic Records</h1>
        <p className="text-muted-foreground mt-1">Enter and manage student exam results with auto grading.</p>
      </div>

      {/* Passing Percentage Setting */}
      <Card className="border-primary/20 bg-primary/5 dark:bg-primary/10">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">Passing Percentage Setting</CardTitle>
          </div>
          <CardDescription>Minimum percentage required to pass. Currently: <strong>{passingPct}%</strong></CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 max-w-xs">
            <Input type="number" min="1" max="99" value={passingInput} onChange={e => setPassingInput(e.target.value)} className="w-24" />
            <span className="text-sm text-muted-foreground">%</span>
            <Button size="sm" onClick={savePassingPct}>Save</Button>
          </div>
        </CardContent>
      </Card>

      {/* Marks Entry Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Calculator className="h-4 w-4 text-primary" />
            <CardTitle>{editingId ? "Edit Result" : "Enter Exam Marks"}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

            <div className="space-y-1.5">
              <Label>Class (optional filter)</Label>
              <SearchableCombobox options={classOptions} value={selClass} onChange={handleClassChange} placeholder="Filter by class..." />
            </div>

            <div className="space-y-1.5">
              <Label>Student <span className="text-destructive">*</span></Label>
              <SearchableCombobox
                options={studentOptions}
                value={selStudent}
                onChange={setSelStudent}
                placeholder="Search by name or roll no..."
                data-testid="select-marks-student"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Subject <span className="text-destructive">*</span></Label>
              <SearchableCombobox options={subjectOptions} value={selSubject} onChange={setSelSubject} placeholder="Search subject..." data-testid="select-marks-subject" />
            </div>

            <div className="space-y-1.5">
              <Label>Exam Type <span className="text-destructive">*</span></Label>
              <SearchableCombobox options={examTypeOptions} value={selExamType} onChange={setSelExamType} placeholder="Select exam type..." data-testid="select-marks-exam-type" />
            </div>

            <div className="space-y-1.5">
              <Label>Exam Title <span className="text-muted-foreground text-xs">(optional)</span></Label>
              <Input placeholder="e.g. Chapter 3 Test" value={examTitle} onChange={e => setExamTitle(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Exam Date</Label>
              <Input type="date" value={examDate} onChange={e => setExamDate(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Total Marks</Label>
              <Input type="number" min="1" placeholder="e.g. 100" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Obtained Marks</Label>
              <Input type="number" min="0" placeholder="e.g. 75" value={obtainedMarks} onChange={e => setObtainedMarks(e.target.value)} />
            </div>

            <div className="space-y-1.5">
              <Label>Result Preview</Label>
              <div className="flex items-center gap-2 h-10 px-3 rounded-md border bg-muted/30 text-sm">
                {percentage !== null && gradeInfo ? (
                  <>
                    <span className="font-bold text-lg">{percentage}%</span>
                    <Badge className={`${gradeInfo.color} text-white`}>{gradeInfo.grade}</Badge>
                    <Badge variant={gradeInfo.pass ? "outline" : "destructive"} className={gradeInfo.pass ? "border-emerald-500 text-emerald-600" : ""}>
                      {gradeInfo.pass ? "Pass" : "Fail"}
                    </Badge>
                  </>
                ) : (
                  <span className="text-muted-foreground">Enter marks to calculate</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button onClick={handleSubmit}>{editingId ? "Update Result" : "Save Result"}</Button>
            {editingId && (
              <Button variant="outline" onClick={() => { setEditingId(null); setObtainedMarks(""); setExamTitle(""); setSelStudent(""); }}>
                Cancel Edit
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              <CardTitle>All Results ({filtered.length})</CardTitle>
            </div>
            <div className="flex gap-2 flex-wrap">
              <SearchableCombobox options={[{ label: "All Classes", value: "all" }, ...classOptions]} value={filterClass} onChange={setFilterClass} placeholder="All Classes" className="w-36" />
              <SearchableCombobox options={[{ label: "All Exam Types", value: "all" }, ...examTypeOptions]} value={filterExamType} onChange={setFilterExamType} placeholder="All Types" className="w-44" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Exam</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Grade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-10 text-muted-foreground">
                      No results yet. Enter marks above to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(r => {
                    const pct = Math.round((r.obtainedMarks / r.totalMarks) * 100);
                    const g = getGrade(pct, r.passingPercentage);
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.studentName}</TableCell>
                        <TableCell>{r.class}</TableCell>
                        <TableCell>{r.subject}</TableCell>
                        <TableCell><span className="text-xs text-muted-foreground">{r.examTitle}</span></TableCell>
                        <TableCell>{r.obtainedMarks}/{r.totalMarks}</TableCell>
                        <TableCell className="font-semibold">{pct}%</TableCell>
                        <TableCell><Badge className={`${g.color} text-white`}>{g.grade}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={g.pass ? "outline" : "destructive"} className={g.pass ? "border-emerald-500 text-emerald-600" : ""}>
                            {g.pass ? "Pass" : "Fail"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(r.date + "T12:00:00").toLocaleDateString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(r)}><Edit2 className="h-3.5 w-3.5" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(r.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></Button>
                          </div>
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
  );
}
