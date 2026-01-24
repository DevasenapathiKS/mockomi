import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export default function AdminJobsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Job Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">Manage all job postings</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-slate-500 dark:text-slate-400">Job management coming soon...</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
