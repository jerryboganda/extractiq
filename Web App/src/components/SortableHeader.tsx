import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  sort: SortConfig | null;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableHeader({ label, sortKey, sort, onSort, className = "" }: SortableHeaderProps) {
  const isActive = sort?.key === sortKey;

  return (
    <th
      className={`text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer select-none hover:text-foreground transition-colors group ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {isActive ? (
          sort.direction === "asc" ? (
            <ArrowUp className="h-3 w-3 text-primary" />
          ) : (
            <ArrowDown className="h-3 w-3 text-primary" />
          )
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
        )}
      </span>
    </th>
  );
}

export function useSort<T>(data: T[], sort: SortConfig | null, getters: Record<string, (item: T) => string | number>): T[] {
  if (!sort) return data;
  const getter = getters[sort.key];
  if (!getter) return data;
  return [...data].sort((a, b) => {
    const aVal = getter(a);
    const bVal = getter(b);
    const cmp = typeof aVal === "number" && typeof bVal === "number" ? aVal - bVal : String(aVal).localeCompare(String(bVal));
    return sort.direction === "asc" ? cmp : -cmp;
  });
}

export function toggleSort(current: SortConfig | null, key: string): SortConfig {
  if (current?.key === key) {
    return { key, direction: current.direction === "asc" ? "desc" : "asc" };
  }
  return { key, direction: "asc" };
}
