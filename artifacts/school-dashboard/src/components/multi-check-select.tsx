import { useState, useRef, useEffect } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  options: string[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  "data-testid"?: string;
}

export function MultiCheckSelect({ options, values, onChange, placeholder = "Select...", disabled, className, "data-testid": testId }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggle = (opt: string) => {
    onChange(values.includes(opt) ? values.filter(v => v !== opt) : [...values, opt]);
  };

  const removeOne = (opt: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(values.filter(v => v !== opt));
  };

  const filtered = query ? options.filter(o => o.toLowerCase().includes(query.toLowerCase())) : options;

  return (
    <div ref={containerRef} className={cn("relative", className)} data-testid={testId}>
      <div
        className={cn(
          "min-h-10 w-full flex flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 py-1.5 text-sm cursor-pointer",
          "hover:border-primary/50 transition-colors",
          open && "ring-2 ring-ring ring-offset-2 border-primary",
          disabled && "opacity-50 pointer-events-none"
        )}
        onClick={() => !disabled && setOpen(!open)}
      >
        {values.length === 0 ? (
          <span className="text-muted-foreground px-1">{placeholder}</span>
        ) : (
          values.map(v => (
            <span key={v} className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
              {v}
              <button onMouseDown={e => { e.stopPropagation(); removeOne(v, e); }} className="hover:text-destructive">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))
        )}
        <div className="ml-auto pl-1">
          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </div>
      </div>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="p-2 border-b">
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              placeholder="Search..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onClick={e => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="max-h-52 overflow-auto">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-sm text-muted-foreground">No results.</div>
            ) : (
              <>
                <div
                  className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent border-b"
                  onMouseDown={e => { e.preventDefault(); onChange(values.length === options.length ? [] : [...options]); }}
                >
                  <Check className={cn("h-4 w-4 text-primary shrink-0", values.length === options.length ? "opacity-100" : "opacity-0")} />
                  <span className="font-medium">Select All</span>
                </div>
                {filtered.map(opt => (
                  <div
                    key={opt}
                    className={cn("flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-accent transition-colors", values.includes(opt) && "bg-accent/40")}
                    onMouseDown={e => { e.preventDefault(); toggle(opt); }}
                  >
                    <div className={cn("h-4 w-4 rounded border flex items-center justify-center shrink-0", values.includes(opt) ? "bg-primary border-primary" : "border-input")}>
                      {values.includes(opt) && <Check className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    {opt}
                  </div>
                ))}
              </>
            )}
          </div>
          {values.length > 0 && (
            <div className="p-2 border-t">
              <button
                className="text-xs text-muted-foreground hover:text-destructive w-full text-left"
                onMouseDown={e => { e.preventDefault(); onChange([]); }}
              >
                Clear all ({values.length} selected)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
