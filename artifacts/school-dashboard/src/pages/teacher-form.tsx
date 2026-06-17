import { useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getTeachers, saveTeachers, Teacher } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

const teacherSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  subject: z.string().min(2, "Subject is required"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  qualification: z.string().min(2, "Qualification is required"),
  joiningDate: z.string().min(1, "Joining date is required"),
  classPerformance: z.coerce.number().min(0).max(100),
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

export default function TeacherForm() {
  const params = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const isEdit = params.id !== "add" && !!params.id;

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: "",
      subject: "",
      phone: "",
      qualification: "",
      joiningDate: new Date().toISOString().split("T")[0],
      classPerformance: 80,
    },
  });

  useEffect(() => {
    if (isEdit) {
      const teachers = getTeachers();
      const teacher = teachers.find(t => t.id === params.id);
      if (teacher) {
        form.reset({
          name: teacher.name,
          subject: teacher.subject,
          phone: teacher.phone,
          qualification: teacher.qualification,
          joiningDate: teacher.joiningDate,
          classPerformance: teacher.classPerformance,
        });
      }
    }
  }, [isEdit, params.id, form]);

  const onSubmit = (values: TeacherFormValues) => {
    const teachers = getTeachers();
    if (isEdit) {
      const updated = teachers.map(t =>
        t.id === params.id ? { ...t, ...values } : t
      );
      saveTeachers(updated);
    } else {
      const newTeacher: Teacher = {
        id: Date.now().toString(),
        ...values,
        attendanceRecord: {},
      };
      saveTeachers([...teachers, newTeacher]);
    }
    setLocation("/teachers");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/teachers">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{isEdit ? "Edit Teacher" : "Add Teacher"}</h1>
          <p className="text-muted-foreground mt-1">{isEdit ? "Update teacher information." : "Add a new teacher record."}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Teacher Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Full name" data-testid="input-teacher-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subject"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Mathematics" data-testid="input-subject" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="qualification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualification</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. MSc Mathematics" data-testid="input-qualification" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="03XX-XXXXXXX" data-testid="input-teacher-phone" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="joiningDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Joining Date</FormLabel>
                      <FormControl>
                        <Input type="date" data-testid="input-joining-date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="classPerformance"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class Performance (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" max="100" data-testid="input-class-performance" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <Button type="submit" data-testid="button-submit-teacher">
                  {isEdit ? "Update Teacher" : "Add Teacher"}
                </Button>
                <Link href="/teachers">
                  <Button type="button" variant="outline">Cancel</Button>
                </Link>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
