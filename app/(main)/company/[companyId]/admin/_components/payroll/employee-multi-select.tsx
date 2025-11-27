"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmployeeMultiSelectProps {
  companyId?: string;
  value: string[];                // selected employee IDs
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export function EmployeeMultiSelect({
  companyId,
  value,
  onChange,
  disabled,
}: EmployeeMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["company-employees", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const res = await fetch(`/api/company/${companyId}/employee`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Failed to load employees");
      }
      return res.json();
    },
  });

  const allEmployees = data?.data.employees ?? [];

  const selectedEmployees = useMemo(
    () => allEmployees.filter((e:any) => value.includes(e.id)),
    [allEmployees, value]
  );

  const toggleEmployee = (id: string) => {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  };

  const clearAll = () => onChange([]);

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            disabled={disabled || isLoading}
            className={cn(
              "w-full justify-between",
              !selectedEmployees.length && "text-muted-foreground"
            )}
          >
            {selectedEmployees.length === 0
              ? isLoading
                ? "Loading employees..."
                : "Select employees"
              : `${selectedEmployees.length} selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[320px] p-0">
          <Command>
            <CommandInput placeholder="Search employee by name or email..." />
            <CommandList>
              <CommandEmpty>No employees found.</CommandEmpty>
              <CommandGroup>
                {allEmployees.map((emp:any) => {
                  const isSelected = value.includes(emp.id);
                  return (
                    <CommandItem
                      key={emp.id}
                      onSelect={() => toggleEmployee(emp.id)}
                      className="flex items-center justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {emp.name || "Unnamed"}
                        </span>
                        {emp.email && (
                          <span className="text-xs text-muted-foreground">
                            {emp.email}
                          </span>
                        )}
                      </div>
                      {isSelected && (
                        <Check className="h-4 w-4 opacity-100" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Selected chips */}
      {selectedEmployees.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedEmployees.map((emp:any) => (
            <Badge
              key={emp.id}
              variant="secondary"
              className="flex items-center gap-1 pr-1"
            >
              <span>{emp.name || emp.email || "Unnamed"}</span>
              <button
                type="button"
                onClick={() => toggleEmployee(emp.id)}
                className="inline-flex"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            onClick={clearAll}
          >
            Clear
          </Button>
        </div>
      )}
    </div>
  );
}
