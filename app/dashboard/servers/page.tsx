'use client';

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ServerList } from '@/components/servers/ServerList';

export default function ServersPage() {
  return (
    <DashboardLayout>
      <ServerList />
    </DashboardLayout>
  );
}