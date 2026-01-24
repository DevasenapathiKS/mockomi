import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { adminService } from '@/services/adminService';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';

export default function AdminSettingsPage() {
  const { data: health } = useQuery({
    queryKey: ['admin-health'],
    queryFn: adminService.getSystemHealth,
    refetchInterval: 10000,
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">System Settings</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Configure platform settings</p>
        </div>

        {/* System Health */}
        <Card>
          <CardHeader>
            <CardTitle>System Health</CardTitle>
          </CardHeader>
          <CardContent>
            {health && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Database
                    </span>
                    <Badge variant={health.database?.status === 'healthy' ? 'success' : 'error'}>
                      {health.database?.status || 'unknown'}
                    </Badge>
                  </div>
                  {health.database?.responseTime && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {health.database.responseTime}ms
                    </p>
                  )}
                </div>
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Cache</span>
                    <Badge variant={health.cache?.status === 'healthy' ? 'success' : 'error'}>
                      {health.cache?.status || 'unknown'}
                    </Badge>
                  </div>
                  {health.cache?.responseTime && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {health.cache.responseTime}ms
                    </p>
                  )}
                </div>
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Uptime</span>
                    <Badge variant="info">
                      {health.uptime ? `${Math.floor(health.uptime / 3600)}h` : 'N/A'}
                    </Badge>
                  </div>
                  {health.uptime && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {Math.floor(health.uptime / 60)} minutes
                    </p>
                  )}
                </div>
                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Memory</span>
                    <Badge variant="info">
                      {health.memoryUsage
                        ? `${Math.round(health.memoryUsage.heapUsed / 1024 / 1024)}MB`
                        : 'N/A'}
                    </Badge>
                  </div>
                  {health.memoryUsage && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {Math.round((health.memoryUsage.heapUsed / health.memoryUsage.heapTotal) * 100)}% used
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Platform Name" defaultValue="Mockomi" />
            <Input label="Default Interview Price (₹)" type="number" defaultValue="100" />
            <Button variant="primary">Save Changes</Button>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
