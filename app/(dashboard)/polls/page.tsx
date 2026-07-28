'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api, apiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { AdminPoll, PageResult } from '@/types/api';

const STATUS_COLORS: Record<string, 'success' | 'secondary' | 'warning'> = {
  active: 'success',
  closed: 'secondary',
  expired: 'secondary',
};

export default function PollsPage() {
  const qc = useQueryClient();
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursors, setCursors] = useState<string[]>([]);

  const { data, isLoading } = useQuery<PageResult<AdminPoll>>({
    queryKey: ['admin-polls', cursor],
    queryFn: () => api.get('/admin/polls', { params: { cursor, limit: 20 } }).then((r) => r.data),
  });

  const expireMutation = useMutation({
    mutationFn: (pollId: string) => api.post(`/admin/polls/${pollId}/expire`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-polls'] });
      toast({ title: 'Poll expired' });
    },
    onError: (err) => toast({ title: 'Error', description: apiError(err), variant: 'destructive' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (pollId: string) => api.delete(`/admin/polls/${pollId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-polls'] });
      toast({ title: 'Poll deleted', variant: 'destructive' });
    },
    onError: (err) => toast({ title: 'Error', description: apiError(err), variant: 'destructive' }),
  });

  function goNext() {
    if (!data?.nextCursor) return;
    setCursors((c) => [...c, cursor ?? '']);
    setCursor(data.nextCursor ?? undefined);
  }

  function goPrev() {
    const prev = cursors[cursors.length - 1];
    setCursors((c) => c.slice(0, -1));
    setCursor(prev || undefined);
  }

  return (
    <div className="flex flex-col gap-4">
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner className="h-7 w-7" /></div>
      ) : (
        <>
          <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Creator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Options</TableHead>
                  <TableHead>Votes</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((poll) => (
                  <TableRow key={poll.id}>
                    <TableCell className="font-medium text-slate-900 dark:text-slate-100 max-w-[240px] truncate">
                      {poll.question}
                    </TableCell>
                    <TableCell className="text-sm text-slate-600 dark:text-slate-400">{poll.creatorName}</TableCell>
                    <TableCell>
                      <Badge variant={STATUS_COLORS[poll.status] ?? 'secondary'} className="capitalize">
                        {poll.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="tabular-nums text-sm">{poll.optionCount}</TableCell>
                    <TableCell className="tabular-nums text-sm">{poll.voteCount}</TableCell>
                    <TableCell className="text-xs text-slate-500 tabular-nums">{formatDate(poll.expiresAt)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {poll.status === 'active' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => expireMutation.mutate(poll.id)}
                            disabled={expireMutation.isPending}
                          >
                            Expire
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-600 border-red-200 hover:bg-red-50"
                          onClick={() => deleteMutation.mutate(poll.id)}
                          disabled={deleteMutation.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {data?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-8 text-center text-slate-500">No polls found</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{data?.total ?? 0} total polls</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goPrev} disabled={cursors.length === 0}>Previous</Button>
              <Button variant="outline" size="sm" onClick={goNext} disabled={!data?.nextCursor}>Next</Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
