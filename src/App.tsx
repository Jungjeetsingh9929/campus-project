import { useEffect, lazy, Suspense, type ReactNode } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { CampusHydrator } from './components/CampusHydrator';
import { RealtimeNotifications } from './components/RealtimeNotifications';
import { useAuthStore } from './store/authStore';
import { Role } from './types';

const LoginPage = lazy(() => import('./components/LoginPage').then((module) => ({ default: module.LoginPage })));
const OverviewPage = lazy(() => import('./pages/OverviewPage').then((module) => ({ default: module.OverviewPage })));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard').then((module) => ({ default: module.StudentDashboard })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then((module) => ({ default: module.AdminDashboard })));
const EmergencyDashboard = lazy(() => import('./pages/EmergencyDashboard').then((module) => ({ default: module.EmergencyDashboard })));
const FacultyDashboard = lazy(() => import('./pages/FacultyDashboard').then((module) => ({ default: module.FacultyDashboard })));

const roleHome: Record<Role, string> = {
  Student: '/student',
  Faculty: '/faculty',
  Admin: '/admin',
  Security: '/emergency',
};

function Gate({ children, allowed }: { children: ReactNode; allowed?: Role[] }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const role = useAuthStore((state) => state.role);
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowed && !allowed.includes(role)) {
    return <Navigate to={roleHome[role]} replace />;
  }

  return children;
}

function Shell() {
  return (
    <>
      <CampusHydrator />
      <RealtimeNotifications />
      <AppShell />
    </>
  );
}

function Loader() {
  return (
    <div className="grid min-h-screen place-items-center bg-mesh-gradient px-4 text-white">
      <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-4 text-sm text-slate-200">
        Loading campus twin...
      </div>
    </div>
  );
}

export default function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const bootstrapSession = useAuthStore((state) => state.bootstrapSession);

  useEffect(() => {
    void bootstrapSession();
  }, [bootstrapSession]);

  if (isBootstrapping) {
    return <Loader />;
  }

  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <Gate>
              <Shell />
            </Gate>
          }
        >
          <Route index element={<OverviewPage />} />
          <Route path="/student" element={<Gate allowed={['Student', 'Admin']}><StudentDashboard /></Gate>} />
          <Route path="/faculty" element={<Gate allowed={['Faculty', 'Admin']}><FacultyDashboard /></Gate>} />
          <Route path="/admin" element={<Gate allowed={['Admin']}><AdminDashboard /></Gate>} />
          <Route path="/emergency" element={<Gate allowed={['Security', 'Admin']}><EmergencyDashboard /></Gate>} />
        </Route>
        <Route path="*" element={<Navigate to={isAuthenticated ? '/' : '/login'} replace />} />
      </Routes>
    </Suspense>
  );
}
