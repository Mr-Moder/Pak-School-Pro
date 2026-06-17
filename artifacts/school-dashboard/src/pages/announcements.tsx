import { useState, useEffect, useRef, useCallback } from "react";
import {
  getAnnouncements,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  Announcement,
  ANNOUNCEMENT_TTL_MS,
  MAX_ANNOUNCEMENTS,
} from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import {
  Megaphone,
  Plus,
  Trash2,
  Pencil,
  Clock,
  ImageIcon,
  X,
  AlertTriangle,
  CalendarClock,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCreatedAt(ts: number): string {
  return new Date(ts).toLocaleString("en-PK", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function getRemaining(createdAt: number): { label: string; urgent: boolean; expired: boolean } {
  const diff = ANNOUNCEMENT_TTL_MS - (Date.now() - createdAt);
  if (diff <= 0) return { label: "Expired", urgent: true, expired: true };
  const hours = Math.floor(diff / 3_600_000);
  const mins = Math.floor((diff % 3_600_000) / 60_000);
  const urgent = diff < 3_600_000; // less than 1 hour
  if (hours > 0) return { label: `${hours}h ${mins}m remaining`, urgent, expired: false };
  return { label: `${mins}m remaining`, urgent: true, expired: false };
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ─── Image Picker ─────────────────────────────────────────────────────────────

function ImagePicker({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2 MB.");
      return;
    }
    const b64 = await fileToBase64(file);
    onChange(b64);
    e.target.value = "";
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative rounded-lg overflow-hidden border border-border">
          <img src={value} alt="Preview" className="w-full max-h-48 object-cover" />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="w-full h-24 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors text-sm"
        >
          <ImageIcon className="h-6 w-6" />
          <span>Click to upload image</span>
          <span className="text-xs opacity-60">PNG, JPG, WEBP — max 2 MB</span>
        </button>
      )}
      <input
        ref={ref}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

// ─── Countdown Badge ──────────────────────────────────────────────────────────

function CountdownBadge({ createdAt }: { createdAt: number }) {
  const [info, setInfo] = useState(() => getRemaining(createdAt));

  useEffect(() => {
    const id = setInterval(() => setInfo(getRemaining(createdAt)), 30_000);
    return () => clearInterval(id);
  }, [createdAt]);

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
        info.expired
          ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
          : info.urgent
          ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
      }`}
    >
      <Clock className="h-3 w-3" />
      {info.label}
    </span>
  );
}

// ─── Announcement Card ────────────────────────────────────────────────────────

const CARD_ACCENTS = [
  "from-blue-500 to-indigo-500",
  "from-emerald-500 to-teal-500",
  "from-violet-500 to-purple-500",
  "from-rose-500 to-pink-500",
  "from-amber-500 to-orange-500",
];

function AnnouncementCard({
  announcement,
  index,
  onEdit,
  onDelete,
}: {
  announcement: Announcement;
  index: number;
  onEdit: (a: Announcement) => void;
  onDelete: (a: Announcement) => void;
}) {
  const accent = CARD_ACCENTS[index % CARD_ACCENTS.length];

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-border">
      <div className={`h-1.5 bg-gradient-to-r ${accent}`} />
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`shrink-0 rounded-lg p-1.5 bg-gradient-to-br ${accent}`}>
              <Megaphone className="h-4 w-4 text-white" />
            </div>
            <h3 className="font-semibold text-base leading-tight truncate">{announcement.title}</h3>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={() => onEdit(announcement)}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(announcement)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Image */}
        {announcement.image && (
          <div className="rounded-lg overflow-hidden border border-border">
            <img
              src={announcement.image}
              alt="Announcement"
              className="w-full max-h-52 object-cover"
            />
          </div>
        )}

        {/* Message */}
        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
          {announcement.message}
        </p>

        {/* Footer */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50">
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <CalendarClock className="h-3 w-3" />
            {formatCreatedAt(announcement.createdAt)}
          </span>
          <CountdownBadge createdAt={announcement.createdAt} />
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Form Dialog ──────────────────────────────────────────────────────────────

type FormState = { title: string; message: string; image?: string };

function AnnouncementDialog({
  open,
  initial,
  onClose,
  onSave,
  error,
}: {
  open: boolean;
  initial: FormState;
  onClose: () => void;
  onSave: (data: FormState) => void;
  error?: string;
}) {
  const [form, setForm] = useState<FormState>(initial);

  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  const isEdit = !!initial.title;

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-primary" />
            {isEdit ? "Edit Announcement" : "New Announcement"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          {error && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Title <span className="text-destructive">*</span></Label>
            <Input
              placeholder="e.g. Monthly Test Starting Monday"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              maxLength={100}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Message <span className="text-destructive">*</span></Label>
            <Textarea
              placeholder="Write announcement details here..."
              rows={4}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              maxLength={1000}
              className="resize-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Image (optional)</Label>
            <ImagePicker
              value={form.image}
              onChange={img => setForm(f => ({ ...f, image: img }))}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onSave(form)}
            disabled={!form.title.trim() || !form.message.trim()}
          >
            {isEdit ? "Save Changes" : "Post Announcement"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const EMPTY_FORM: FormState = { title: "", message: "", image: undefined };

export default function Announcements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [formInitial, setFormInitial] = useState<FormState>(EMPTY_FORM);
  const [formError, setFormError] = useState<string | undefined>();
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null);

  const reload = useCallback(() => setItems(getAnnouncements()), []);

  useEffect(() => {
    reload();
    // Auto-purge check every 60 seconds
    const id = setInterval(reload, 60_000);
    return () => clearInterval(id);
  }, [reload]);

  const openNew = () => {
    setEditing(null);
    setFormInitial(EMPTY_FORM);
    setFormError(undefined);
    setDialogOpen(true);
  };

  const openEdit = (a: Announcement) => {
    setEditing(a);
    setFormInitial({ title: a.title, message: a.message, image: a.image });
    setFormError(undefined);
    setDialogOpen(true);
  };

  const handleSave = (data: FormState) => {
    if (editing) {
      updateAnnouncement(editing.id, data);
      reload();
      setDialogOpen(false);
    } else {
      const result = addAnnouncement(data);
      if (!result.ok) {
        setFormError(result.error);
        return;
      }
      reload();
      setDialogOpen(false);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteAnnouncement(deleteTarget.id);
    reload();
    setDeleteTarget(null);
  };

  const atMax = items.length >= MAX_ANNOUNCEMENTS;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2.5">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Announcements</h1>
            <p className="text-sm text-muted-foreground">
              {items.length} of {MAX_ANNOUNCEMENTS} active · auto-expire in 25 hours
            </p>
          </div>
        </div>
        <Button onClick={openNew} disabled={atMax} className="gap-2 shrink-0">
          <Plus className="h-4 w-4" />
          New Announcement
        </Button>
      </div>

      {/* Capacity Warning */}
      {atMax && (
        <div className="flex items-start gap-2 text-sm bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-700 rounded-lg px-4 py-3">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>
            <strong>Limit reached.</strong> Maximum {MAX_ANNOUNCEMENTS} active announcements allowed.
            Delete an existing announcement to post a new one.
          </span>
        </div>
      )}

      {/* Cards */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
          <Megaphone className="h-12 w-12 mb-4 opacity-20" />
          <p className="text-lg font-medium">No announcements yet</p>
          <p className="text-sm mt-1">Click "New Announcement" to post one.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((item, i) => (
            <AnnouncementCard
              key={item.id}
              announcement={item}
              index={i}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Create / Edit Dialog */}
      <AnnouncementDialog
        open={dialogOpen}
        initial={formInitial}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        error={formError}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={v => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Announcement?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>"{deleteTarget?.title}"</strong> will be permanently deleted.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
