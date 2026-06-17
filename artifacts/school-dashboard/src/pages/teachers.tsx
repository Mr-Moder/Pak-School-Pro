import { useState, useEffect } from "react";
import { getTeachers, saveTeachers, Teacher } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit2, Trash2 } from "lucide-react";
import { Link } from "wouter";

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    setTeachers(getTeachers());
  }, []);

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this teacher?")) {
      const updated = teachers.filter(t => t.id !== id);
      setTeachers(updated);
      saveTeachers(updated);
    }
  };

  const filtered = teachers.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.subject.toLowerCase().includes(search.toLowerCase())
  );

  const getPerformanceBadge = (pct: number) => {
    if (pct >= 80) return "bg-emerald-500 hover:bg-emerald-600 text-white";
    if (pct >= 60) return "bg-amber-500 hover:bg-amber-600 text-white";
    return "bg-red-500 hover:bg-red-600 text-white";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Teachers</h1>
          <p className="text-muted-foreground mt-1">Manage teacher records and information.</p>
        </div>
        <Link href="/teachers/add">
          <Button data-testid="button-add-teacher">
            <Plus className="mr-2 h-4 w-4" /> Add Teacher
          </Button>
        </Link>
      </div>

      <div className="flex items-center bg-card p-4 rounded-lg border">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or subject..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="input-search-teachers"
          />
        </div>
      </div>

      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Subject</TableHead>
              <TableHead>Qualification</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Class Performance</TableHead>
              <TableHead>Joining Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No teachers found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((teacher) => (
                <TableRow key={teacher.id} data-testid={`row-teacher-${teacher.id}`}>
                  <TableCell className="font-medium">{teacher.name}</TableCell>
                  <TableCell>{teacher.subject}</TableCell>
                  <TableCell>{teacher.qualification}</TableCell>
                  <TableCell>{teacher.phone}</TableCell>
                  <TableCell>
                    <Badge className={getPerformanceBadge(teacher.classPerformance)}>
                      {teacher.classPerformance}%
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(teacher.joiningDate).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/teachers/${teacher.id}`}>
                        <Button variant="ghost" size="icon" data-testid={`button-edit-teacher-${teacher.id}`}>
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(teacher.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        data-testid={`button-delete-teacher-${teacher.id}`}
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
  );
}
