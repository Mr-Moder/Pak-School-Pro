import { useState, useEffect } from "react";
import { getStudents, deleteStudentCompletely, getExamResults, Student, CLASSES } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Edit2, Trash2, AlertTriangle } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Students() {
  const { toast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<Student | null>(null);
  const [examResultCount, setExamResultCount] = useState(0);

  useEffect(() => {
    setStudents(getStudents());
  }, []);

  const openDeleteDialog = (student: Student) => {
    const count = getExamResults().filter(r => r.studentId === student.id).length;
    setExamResultCount(count);
    setPendingDelete(student);
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const { examResultsRemoved } = deleteStudentCompletely(pendingDelete.id);
    setStudents(getStudents());
    setPendingDelete(null);
    toast({
      title: `${pendingDelete.name} deleted`,
      description: `Removed student + ${examResultsRemoved} exam result${examResultsRemoved !== 1 ? "s" : ""} from all sections.`,
    });
  };

  const filtered = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.includes(search) || s.fatherName.toLowerCase().includes(search.toLowerCase());
    const matchesClass = classFilter === "all" || s.class === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground mt-1">
            {students.length} total student{students.length !== 1 ? "s" : ""} across {CLASSES.filter(c => students.some(s => s.class === c)).length} classes.
          </p>
        </div>
        <Link href="/students/add" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2">
          <Plus className="h-4 w-4" /> Add Student
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center bg-card p-4 rounded-lg border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, roll number, or father's name..."
            className="pl-8"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter by class" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Roll No</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Fee Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    {search || classFilter !== "all" ? "No students match your search." : "No students yet. Add a student to get started."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.rollNumber}</TableCell>
                    <TableCell>
                      <div className="font-medium">{student.name}</div>
                      <div className="text-xs text-muted-foreground">{student.fatherName}</div>
                    </TableCell>
                    <TableCell>{student.class}</TableCell>
                    <TableCell>{student.phone}</TableCell>
                    <TableCell>
                      <Badge className={student.feeStatus === "paid" ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-red-500 hover:bg-red-600 text-white"}>
                        {student.feeStatus === "paid" ? "Paid" : "Pending"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Link href={`/students/${student.id}`} className="inline-flex items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground h-9 w-9 transition-colors">
                          <Edit2 className="h-4 w-4" />
                        </Link>
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => openDeleteDialog(student)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          data-testid={`button-delete-${student.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Cascade Delete Confirmation Dialog */}
      <AlertDialog open={!!pendingDelete} onOpenChange={open => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Student Completely
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  You are about to permanently delete <strong>{pendingDelete?.name}</strong> (Roll: {pendingDelete?.rollNumber}, Class: {pendingDelete?.class}).
                </p>
                <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm space-y-1">
                  <p className="font-semibold text-destructive mb-2">This will remove ALL their data from:</p>
                  <p>✗ Student records & profile</p>
                  <p>✗ Attendance history</p>
                  <p>✗ {examResultCount} academic exam result{examResultCount !== 1 ? "s" : ""}</p>
                  <p>✗ Progress reports & rankings</p>
                  <p>✗ Top performers & analytics</p>
                  <p>✗ All charts and statistics</p>
                </div>
                <p className="text-sm font-medium text-destructive">This action cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              data-testid="button-confirm-delete"
            >
              Delete Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
