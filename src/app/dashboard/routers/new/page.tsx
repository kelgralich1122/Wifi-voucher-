'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Button, Input } from '@/components/ui';

export default function NewRouterPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'mikrotik',
    ipAddress: '',
    secretKey: '',
  });
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/routers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push('/dashboard/routers');
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Add Router</h1>
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Router Name</label>
              <Input
                placeholder="e.g. Main Lobby Router"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Brand / Type</label>
              <select
                className="w-full h-10 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="mikrotik">MikroTik RouterOS</option>
                <option value="unifi">Ubiquiti UniFi</option>
                <option value="tplink">TP-Link Omada</option>
                <option value="openwrt">OpenWrt</option>
                <option value="cisco">Cisco Meraki</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">IP Address / Hostname</label>
              <Input
                placeholder="192.168.88.1"
                value={formData.ipAddress}
                onChange={(e) => setFormData({ ...formData, ipAddress: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Secret Key / API Key</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={formData.secretKey}
                onChange={(e) => setFormData({ ...formData, secretKey: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" type="button" onClick={() => router.back()}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Router'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}