import { useState, useEffect } from "react";
import { getStudents, saveStudents, Student, CLASSES } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard, CheckCircle2, Clock } from "lucide-react";

export default function Fees() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setStudents(getStudents());
  }, []);

  const toggleFee = (studentId: string) => {
    const updated = students.map(s =>
      s.id === studentId
        ? { ...s, feeStatus: s.feeStatus === "paid" ? "pending" as const : "paid" as const }
        : s
    );
    setStudents(updated);
    saveStudents(updated);
  };

  const markAllPaid = () => {
    const updated = students.map(s => {
      const matchesClass = classFilter === "all" || s.class === classFilter;
      return matchesClass ? { ...s, feeStatus: "paid" as const } : s;
    });
    setStudents(updated);
    saveStudents(updated);
  };

  const filtered = students.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber.includes(search);
    const matchesClass = classFilter === "all" || s.class === classFilter;
    const matchesStatus = statusFilter === "all" || s.feeStatus === statusFilter;
    return matchesSearch && matchesClass && matchesStatus;
  });

  const paidCount = students.filter(s => s.feeStatus === "paid").length;
  const pendingCount = students.filter(s => s.feeStatus === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fee Management</h1>
        <p className="text-muted-foreground mt-1">Track and manage student fee status.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <Card className="border-emerald-200 dark:border-emerald-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fees Paid</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-600">{paidCount}</div>
            <p className="text-xs text-muted-foreground mt-1">{students.length > 0 ? Math.round((paidCount / students.length) * 100) : 0}% of total</p>
          </CardContent>
        </Card>
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fees Pending</CardTitle>
            <Clock className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{pendingCount}</div>
            <p className="text-xs text-muted-foreground mt-1">{students.length > 0 ? Math.round((pendingCount / students.length) * 100) : 0}% of total</p>
          </CardContent>
        </Card>
        <Card className="col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Enrolled</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-card p-4 rounded-lg border flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Input
            placeholder="Search by name or roll..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="input-search-fees"
          />
        </div>
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-full sm:w-[160px]" data-testid="select-fees-class">
            <SelectValue placeholder="All Classes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Classes</SelectItem>
            {CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[140px]" data-testid="select-fees-status">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={markAllPaid} variant="outline" size="sm" data-testid="button-mark-all-paid">
          Mark {classFilter === "all" ? "All" : `Class ${classFilter}`} as Paid
        </Button>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Roll No</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Fee Status</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No students found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(student => (
                <TableRow key={student.id} data-testid={`row-fee-${student.id}`}>
                  <TableCell className="font-medium">{student.rollNumber}</TableCell>
                  <TableCell>
                    <div>{student.name}</div>
                    <div className="text-xs text-muted-foreground">{student.fatherName}</div>
                  </TableCell>
                  <TableCell>{student.class}</TableCell>
                  <TableCell>
                    <Badge
                      className={
                        student.feeStatus === "paid"
                          ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                          : "bg-red-500 hover:bg-red-600 text-white"
                      }
                      data-testid={`status-fee-${student.id}`}
                    >
                      {student.feeStatus === "paid" ? "PAID" : "PENDING"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleFee(student.id)}
                      data-testid={`button-toggle-fee-${student.id}`}
                    >
                      Mark as {student.feeStatus === "paid" ? "Pending" : "Paid"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
