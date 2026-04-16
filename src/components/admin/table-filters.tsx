"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AdminTableFiltersProps = {
  title?: string;
  description?: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  children?: React.ReactNode;
};

export function AdminTableFilters({
  title = "Search",
  description,
  searchValue,
  onSearchChange,
  searchPlaceholder = "Search...",
  children,
}: AdminTableFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_auto]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchValue}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder={searchPlaceholder}
              className="pl-9"
            />
          </div>
          {children ? <div className="flex flex-wrap items-center gap-3">{children}</div> : null}
        </div>
      </CardContent>
    </Card>
  );
}
