'use client';

import { useQuery } from '@tanstack/react-query';
import { Spinner } from '@/components/ui/spinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import type { AdminUserDetail, AuditLog, PageResult } from '@/types/api';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
      <span className="text-right text-slate-800 dark:text-slate-200">{value}</span>
    </div>
  );
}

export default function ProfilePage() {
  const { data: me, isLoading: meLoading } = useQuery<AdminUserDetail>({
    queryKey: ['admin-me'],
    queryFn: () => api.get('/me/profile').then((r) => r.data),
  });

  const { data: logs, isLoading: logsLoading } = useQuery<PageResult<AuditLog>>({
    queryKey: ['admin-audit-logs-me', me?.id],
    queryFn: () => api.get('/admin/audit-logs', { params: { userId: me!.id, limit: 20 } }).then((r) => r.data),
    enabled: !!me,
  });

  if (meLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {me && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Account</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Row label="Display name" value={me.displayName} />
            <Row label="Email" value={me.email} />
            <Row label="Username" value={me.username ? `@${me.username}` : '—'} />
            <Row label="Role" value={<Badge variant="default">Super Admin</Badge>} />
            <Row label="Joined" value={formatDate(me.createdAt)} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-sm">Recent admin actions</CardTitle></CardHeader>
        <CardContent className="p-0">
          {logsLoading ? (
            <div className="flex justify-center py-8"><Spinner className="h-6 w-6" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(logs?.items as AuditLog[])?.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="text-xs font-mono text-slate-700 dark:text-slate-300">{log.action}</TableCell>
                    <TableCell className="text-xs text-slate-500 capitalize">{log.entityType}</TableCell>
                    <TableCell className="text-xs text-slate-500 tabular-nums">{log.ipAddress ?? '-'}</TableCell>
                    <TableCell className="text-xs text-slate-500 tabular-nums">{formatDate(log.createdAt)}</TableCell>
                  </TableRow>
                ))}
                {(!logs?.items?.length) && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-8 text-center text-slate-500 text-sm">No activity yet</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
