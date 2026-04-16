'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ENDPOINTS } from '@/lib/api';
import { RefreshCw, ShieldCheck, KeyRound } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AdminTableFilters } from '@/components/admin/table-filters';
import { AdminTableFooter } from '@/components/admin/table-footer';
import { toast } from 'sonner';

type PermissionGroupRow = {
  id: number;
  role_name?: string;
  page_section?: string;
  operation?: string;
  system_defined?: string;
  active?: string;
  created_by?: string | null;
  updated_by?: string | null;
  updated_at?: string | null;
};

const yesNoVariant = (value?: string) =>
  String(value || '').toLowerCase() === 'yes' ? 'default' : 'secondary';

export default function PermissionGroupsPage() {
  const [rows, setRows] = useState<PermissionGroupRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const loadRows = async () => {
    setLoading(true);
    try {
      const res = await fetch(ENDPOINTS.PERMISSION_GROUPS.LIST, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load permission groups');
      const data = await res.json();
      setRows(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load role permissions');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadRows();
  }, []);

  const filteredRows = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.role_name, row.page_section, row.operation, row.created_by, row.updated_by]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(term)
    );
  }, [rows, search]);

  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const startIndex = totalRows === 0 ? 0 : (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const pagedRows = filteredRows.slice(startIndex, endIndex);

  useEffect(() => {
    setPage(1);
  }, [search, rowsPerPage]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  return (
    <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Permissions</h1>
          <p className="text-muted-foreground">Manage permission groups by role, page section, and operation.</p>
        </div>
        <Button variant="outline" size="icon" onClick={loadRows} disabled={loading} aria-label="Refresh permission groups" title="Refresh permission groups">
          <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
        </Button>
      </div>

      <AdminTableFilters
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search role, page section, operation, or user"
        title="Search"
        description="Filter role permissions by role, page section, operation, or user."
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Permission Groups
          </CardTitle>
          <CardDescription>
            Showing {filteredRows.length} of {rows.length}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Page Section</TableHead>
                  <TableHead>Operation</TableHead>
                  <TableHead>System Defined</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Entered User</TableHead>
                  <TableHead>Modified User</TableHead>
                  <TableHead>Modified Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">Loading role permissions...</TableCell>
                  </TableRow>
                ) : pagedRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">No role permissions found.</TableCell>
                  </TableRow>
                ) : (
                  pagedRows.map((row, index) => (
                    <TableRow key={row.id}>
                      <TableCell>{startIndex + index + 1}</TableCell>
                      <TableCell className="font-medium">{row.role_name || '-'}</TableCell>
                      <TableCell>{row.page_section || '-'}</TableCell>
                      <TableCell>
                        <div className="inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium">
                          <KeyRound className="h-3 w-3" />
                          {row.operation || '-'}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={yesNoVariant(row.system_defined)}>{String(row.system_defined || 'no').toUpperCase()}</Badge></TableCell>
                      <TableCell><Badge variant={yesNoVariant(row.active)}>{String(row.active || 'no').toUpperCase()}</Badge></TableCell>
                      <TableCell>{row.created_by || '-'}</TableCell>
                      <TableCell>{row.updated_by || '-'}</TableCell>
                      <TableCell>{row.updated_at || '-'}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AdminTableFooter
        currentPage={currentPage}
        totalPages={totalPages}
        totalRows={totalRows}
        rowsPerPage={rowsPerPage}
        startIndex={startIndex}
        endIndex={endIndex}
        onPageChange={setPage}
        onRowsPerPageChange={setRowsPerPage}
      />
    </div>
  );
}
