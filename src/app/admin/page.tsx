'use client';

import React from 'react';
import { useTab } from './layout';
import DashboardPage from './dashboard/DashboardTab';
import UserManagementPage from './users/UsersTab';
import DepositManagementPage from './deposits/DepositsTab';
import WithdrawalManagementPage from './withdrawals/WithdrawalsTab';
import PlansPage from './plans/PlansTab';
import TasksPage from './tasks/TasksTab';
import GiftCodesPage from './gift-codes/GiftCodesTab';
import SettingsPage from './settings/SettingsTab';
import ReferralsPage from './referrals/ReferralsTab';
import UpiDirectoryPage from './upi-directory/UpiDirectoryTab';

export default function AdminPage() {
  const { activeTab } = useTab();

  switch (activeTab) {
    case 'dashboard':
      return <DashboardPage />;
    case 'users':
      return <UserManagementPage />;
    case 'deposits':
      return <DepositManagementPage />;
    case 'withdrawals':
      return <WithdrawalManagementPage />;
    case 'plans':
      return <PlansPage />;
    case 'tasks':
      return <TasksPage />;
    case 'gift-codes':
      return <GiftCodesPage />;
    case 'settings':
      return <SettingsPage />;
    case 'referrals':
      return <ReferralsPage />;
    case 'upi-directory':
      return <UpiDirectoryPage />;
    default:
      return <DashboardPage />;
  }
}
