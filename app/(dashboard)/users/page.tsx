'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { Search, UserPlus, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { api, apiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { AdminUser, PageResult } from '@/types/api';

const createSchema = z.object({
  email: z.string().email('Valid email required'),
  displayName: z.string().min(1, 'Display name required').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
type CreateForm = z.infer<typeof createSchema>;

export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState<string | undefined>();
  const [cursors, setCursors] = useState<string[]>([]);
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery<PageResult<AdminUser>>({
    queryKey: ['admin-users', search, cursor],
    queryFn: () =>
      api
        .get('/admin/users', { params: { search: search || undefined, cursor, limit: 20 } })
        .then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateForm>({
    resolver: zodResolver(createSchema),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateForm) => api.post('/admin/users', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'User created' });
      setCreateOpen(false);
      reset();
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

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCursor(undefined);
    setCursors([]);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-2 max-w-sm">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search by email or username..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button type="submit" variant="outline" size="sm">Search</Button>
        </form>
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Create User
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner className="h-7 w-7" /></div>
      ) : (
        <>
          <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Username</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.items.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="font-medium text-slate-900 dark:text-slate-100">{user.displayName}</p>
                            {user.isVerified && (
                              <CheckCircle className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {user.username ? `@${user.username}` : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{user.tier}</Badge>
                    </TableCell>
                    <TableCell>
                      {user.platformRole === 'super_admin' ? (
                        <Badge variant="default">Super Admin</Badge>
                      ) : (
                        <span className="text-xs text-slate-500">User</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {user.isDeleted ? (
                        <Badge variant="destructive">Deleted</Badge>
                      ) : user.isBanned ? (
                        <Badge variant="destructive">Banned</Badge>
                      ) : (
                        <Badge variant="success">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 tabular-nums">{formatDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <Link href={`/users/${user.id}`} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
                {data?.items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-slate-500 py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <span>{data?.total ?? 0} total users</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={goPrev} disabled={cursors.length === 0}>
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={goNext} disabled={!data?.nextCursor}>
                Next
              </Button>
            </div>
          </div>
        </>
      )}

      <Dialog open={createOpen} onOpenChange={(o) => { if (!o) { setCreateOpen(false); reset(); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create User</DialogTitle>
            <DialogDescription>Create a new user account directly as admin.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="flex flex-col gap-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="user@example.com" {...register('email')} />
              {errors.email && <p className="text-xs text-red-600">{errors.email.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="displayName">Display Name</Label>
              <Input id="displayName" placeholder="Full Name" {...register('displayName')} />
              {errors.displayName && <p className="text-xs text-red-600">{errors.displayName.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Min 8 characters" {...register('password')} />
              {errors.password && <p className="text-xs text-red-600">{errors.password.message}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => { setCreateOpen(false); reset(); }}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
