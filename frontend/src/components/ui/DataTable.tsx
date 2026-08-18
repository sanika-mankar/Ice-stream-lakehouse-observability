import React from 'react';
import { cn } from '../../lib/utils';

interface DataTableProps<T> {
  data: T[];
  columns: {
    header: string;
    accessorKey: keyof T;
    cell?: (item: T) => React.ReactNode;
    className?: string;
  }[];
  className?: string;
}

export function DataTable<T>({ data, columns, className }: DataTableProps<T>) {
  return (
    <div className={cn("w-full overflow-auto rounded-md border border-border", className)}>
      <table className="w-full caption-bottom text-sm">
        <thead className="[&_tr]:border-b bg-muted/50">
          <tr className="border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
            {columns.map((col, i) => (
              <th key={i} className={cn("h-10 px-4 text-left align-middle font-medium text-muted-foreground", col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&_tr:last-child]:border-0">
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-4 text-center text-muted-foreground">
                No results.
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                {columns.map((col, j) => (
                  <td key={j} className={cn("p-4 align-middle", col.className)}>
                    {col.cell ? col.cell(row) : (row[col.accessorKey] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
