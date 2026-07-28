'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { api, apiError } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import type { AdConfig } from '@/types/api';

type EditFormRaw = { adsEnabled: 'true' | 'false'; injectionInterval: string; adUnitId: string };

export default function RevenuePage() {
  const qc = useQueryClient();
  const [selected, setSelected] = useState<AdConfig | null>(null);

  const { data: configs, isLoading } = useQuery<AdConfig[]>({
    queryKey: ['admin-ad-configs'],
    queryFn: () => api.get('/admin/ad-configs').then((r) => r.data),
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<EditFormRaw>();

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: EditFormRaw }) => {
      const interval = parseInt(data.injectionInterval, 10);
      if (isNaN(interval) || interval < 1 || interval > 100) throw new Error('Interval must be 1–100');
      return api.patch(`/admin/ad-configs/${id}`, {
        adsEnabled: data.adsEnabled === 'true',
        injectionInterval: interval,
        adUnitId: data.adUnitId || undefined,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-ad-configs'] });
      toast({ title: 'Ad config updated' });
      setSelected(null);
    },
    onError: (err) => toast({ title: 'Error', description: apiError(err), variant: 'destructive' }),
  });

  function openEdit(config: AdConfig) {
    setSelected(config);
    reset({
      adsEnabled: config.adsEnabled ? 'true' : 'false',
      injectionInterval: String(config.injectionInterval),
      adUnitId: config.adUnitId ?? '',
    });
  }

  if (isLoading) return <div className="flex justify-center py-20"><Spinner className="h-8 w-8" /></div>;

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {configs?.map((config) => (
          <Card key={config.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{config.name}</CardTitle>
                <Button size="icon" variant="ghost" onClick={() => openEdit(config)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <Row label="Ads enabled" value={
                <Badge variant={config.adsEnabled ? 'success' : 'secondary'}>
                  {config.adsEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              } />
              <Row label="Injection interval" value={`Every ${config.injectionInterval} posts`} />
              <Row label="Ad unit ID" value={config.adUnitId ?? <span className="text-slate-400 text-xs">Not set</span>} />
              <Row label="Updated" value={<span className="text-xs tabular-nums">{formatDate(config.updatedAt)}</span>} />
            </CardContent>
          </Card>
        ))}
        {configs?.length === 0 && (
          <p className="col-span-full py-8 text-center text-slate-500 text-sm">
            No ad configs found. Run DB seed to populate.
          </p>
        )}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) setSelected(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit &ldquo;{selected?.name}&rdquo;</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={handleSubmit((d) => selected && updateMutation.mutate({ id: selected.id, data: d }))}
            className="flex flex-col gap-4 mt-2"
          >
            <div className="flex flex-col gap-1.5">
              <Label>Ads enabled</Label>
              <Select value={watch('adsEnabled')} onValueChange={(v) => setValue('adsEnabled', v as 'true' | 'false')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Enabled</SelectItem>
                  <SelectItem value="false">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="injectionInterval">Injection interval (posts between ads)</Label>
              <Input
                id="injectionInterval"
                type="number"
                min={1}
                max={100}
                {...register('injectionInterval', {
                  required: 'Required',
                  min: { value: 1, message: 'Min 1' },
                  max: { value: 100, message: 'Max 100' },
                })}
              />
              {errors.injectionInterval && <p className="text-xs text-red-600">{errors.injectionInterval.message}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="adUnitId">Ad unit ID</Label>
              <Input id="adUnitId" placeholder="ca-app-pub-..." {...register('adUnitId')} />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setSelected(null)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-500 dark:text-slate-400 shrink-0">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
