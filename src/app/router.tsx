/* eslint-disable react-refresh/only-export-components */
import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider } from '@/context/auth-context';
import { useAuth } from '@/hooks/use-auth';
import { AppShell } from '@/components/layout/app-shell';

const LoginPage = lazy(() => import('@/pages/login-page').then((module) => ({ default: module.LoginPage })));
const DashboardPage = lazy(() => import('@/pages/dashboard-page').then((module) => ({ default: module.DashboardPage })));
const SubmitPicksPage = lazy(() => import('@/pages/submit-picks-page').then((module) => ({ default: module.SubmitPicksPage })));
const AllPicksPage = lazy(() => import('@/pages/all-picks-page').then((module) => ({ default: module.AllPicksPage })));
const ResultsPage = lazy(() => import('@/pages/results-page').then((module) => ({ default: module.ResultsPage })));
const AdminPage = lazy(() => import('@/pages/admin-page').then((module) => ({ default: module.AdminPage })));

function RootLayout() {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-muted">Loading paddock...</div>}>
        <Outlet />
      </Suspense>
    </AuthProvider>
  );
}

function ProtectedLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted">Loading paddock...</div>;
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function AdminOnlyLayout() {
  const { profile } = useAuth();

  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      {
        element: <ProtectedLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: '/submit', element: <SubmitPicksPage /> },
          { path: '/picks', element: <AllPicksPage /> },
          { path: '/results', element: <ResultsPage /> },
          {
            element: <AdminOnlyLayout />,
            children: [{ path: '/admin', element: <AdminPage /> }],
          },
        ],
      },
    ],
  },
]);
