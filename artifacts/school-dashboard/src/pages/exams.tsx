import { useState, useEffect } from "react";
import { getExams, saveExams, Exam, CLASSES, SUBJECTS, EXAM_TYPES } from "@/lib/storage";
import { MultiCheckSelect } from "@/components/multi-check-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Exams() {
  const { toast } = useToast();
  const [exams, setExams] = useState<Exam[]>([]);
  const [activeType, setActiveType] = useState("daily");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form
  const [title, setTitle] = useState("");
  const [selClasses, setSelClasses] = useState<string[]>([]);
  const [selSubjects, setSelSubjects] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split("T")[0]);
  const [dateTill, setDateTill] = useState(new Date().toISOString().split("T")[0]);
  const [instructions, setInstructions] = useState("");

  useEffect(() => { setExams(getExams()); }, []);

  const resetForm = () => {
    setTitle(""); setSelClasses([]); setSelSubjects([]);
    setDateFrom(new Date().toISOString().split("T")[0]);
    setDateTill(new Date().toISOString().split("T")[0]);
    setInstructions(""); setEditingId(null); setShowForm(false);
  };

  const handleSubmit = () => {
    if (!title || selClasses.length === 0 || selSubjects.length === 0) {
      toast({ title: "Please fill all required fields", description: "Title, at least one class, and at least one subject are required.", variant: "destructive" });
      return;
    }
    const exam: Exam = {
      id: editingId || Date.now().toString(),
      title, type: activeType,
      classes: selClasses, subjects: selSubjects,
      dateFrom, dateTill, instructions,
    };
    let updated: Exam[];
    if (editingId) {
      updated = exams.map(e => e.id === editingId ? exam : e);
      toast({ title: "Exam updated successfully" });
    } else {
      updated = [exam, ...exams];
      toast({ title: "Exam created successfully" });
    }
    setExams(updated);
    saveExams(updated);
    resetForm();
  };

  const handleEdit = (exam: Exam) => {
    setTitle(exam.title);
    setSelClasses(exam.classes);
    setSelSubjects(exam.subjects);
    setDateFrom(exam.dateFrom);
    setDateTill(exam.dateTill);
    setInstructions(exam.instructions || "");
    setEditingId(exam.id);
    setActiveType(exam.type);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id: string) => {
    if (!window.confirm("Delete this exam?")) return;
    const updated = exams.filter(e => e.id !== id);
    setExams(updated);
    saveExams(updated);
  };

  const activeLabel = EXAM_TYPES.find(e => e.value === activeType)?.label || activeType;
  const filtered = exams.filter(e => e.type === activeType);

  const formatDate = (d: string) => d ? new Date(d + "T12:00:00").toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" }) : "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Exams</h1>
          <p className="text-muted-foreground mt-1">Create and manage all exam schedules. Select multiple classes and subjects at once.</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="mr-2 h-4 w-4" />
          {showForm ? "Cancel" : "New Exam"}
        </Button>
      </div>

      {/* Exam Type Tabs */}
      <div className="flex flex-wrap gap-2">
        {EXAM_TYPES.map(et => (
          <button
            key={et.value}
            onClick={() => setActiveType(et.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              activeType === et.value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {et.label}
            {exams.filter(e => e.type === et.value).length > 0 && (
              <span className={`ml-1.5 text-xs rounded-full px-1.5 py-0.5 ${activeType === et.value ? "bg-white/20" : "bg-primary/10 text-primary"}`}>
                {exams.filter(e => e.type === et.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <Card className="border-primary/30">
          <CardHeader>
            <CardTitle>{editingId ? "Edit Exam" : `Create ${activeLabel}`}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Title */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Exam Title <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. Chapter 5 — Monthly Test" value={title} onChange={e => setTitle(e.target.value)} />
              </div>

              {/* Classes multi-select */}
              <div className="space-y-1.5">
                <Label>Classes <span className="text-destructive">*</span> <span className="text-muted-foreground text-xs">(select multiple)</span></Label>
                <MultiCheckSelect options={CLASSES} values={selClasses} onChange={setSelClasses} placeholder="Select one or more classes..." />
              </div>

              {/* Subjects multi-select */}
              <div className="space-y-1.5">
                <Label>Subjects <span className="text-destructive">*</span> <span className="text-muted-foreground text-xs">(select multiple)</span></Label>
                <MultiCheckSelect options={SUBJECTS} values={selSubjects} onChange={setSelSubjects} placeholder="Select one or more subjects..." />
              </div>

              {/* Date From */}
              <div className="space-y-1.5">
                <Label>Date From</Label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>

              {/* Date Till */}
              <div className="space-y-1.5">
                <Label>Date Till</Label>
                <Input type="date" value={dateTill} onChange={e => setDateTill(e.target.value)} />
              </div>

              {/* Instructions */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Instructions <span className="text-muted-foreground text-xs">(optional)</span></Label>
                <Textarea placeholder="e.g. Bring calculator. No mobile phones. Syllabus: Ch 1-5." value={instructions} onChange={e => setInstructions(e.target.value)} rows={3} />
              </div>
            </div>

            {/* Preview of selection */}
            {(selClasses.length > 0 || selSubjects.length > 0) && (
              <div className="rounded-md bg-primary/5 border border-primary/20 p-3 text-sm space-y-1">
                <p className="font-medium text-primary">This exam will be created for:</p>
                {selClasses.length > 0 && <p className="text-muted-foreground">📚 Classes: <span className="text-foreground">{selClasses.join(", ")}</span></p>}
                {selSubjects.length > 0 && <p className="text-muted-foreground">📖 Subjects: <span className="text-foreground">{selSubjects.join(", ")}</span></p>}
                <p className="text-muted-foreground">📅 Period: <span className="text-foreground">{formatDate(dateFrom)} → {formatDate(dateTill)}</span></p>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleSubmit}>{editingId ? "Update Exam" : "Create Exam"}</Button>
              <Button variant="outline" onClick={resetForm}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exam List */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-primary" />
            <CardTitle>{activeLabel} — {filtered.length} exam{filtered.length !== 1 ? "s" : ""}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Classes</TableHead>
                  <TableHead>Subjects</TableHead>
                  <TableHead>Date From</TableHead>
                  <TableHead>Date Till</TableHead>
                  <TableHead>Instructions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No {activeLabel.toLowerCase()} exams yet. Click "New Exam" to create one.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map(exam => (
                    <TableRow key={exam.id}>
                      <TableCell className="font-medium">{exam.title}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {exam.classes.map(c => <Badge key={c} variant="outline" className="text-xs">{c}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {exam.subjects.map(s => <Badge key={s} className="bg-primary/10 text-primary text-xs border-0">{s}</Badge>)}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(exam.dateFrom)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(exam.dateTill)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate">{exam.instructions || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(exam)}><Edit2 className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(exam.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
