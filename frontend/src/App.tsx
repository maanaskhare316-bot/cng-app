import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import MainLayout from './layouts/MainLayout';
import LoadingSpinner from './components/ui/LoadingSpinner';

const Dashboard       = lazy(() => import('./pages/Dashboard'));
const TripPlanner     = lazy(() => import('./pages/TripPlanner'));
const RouteResults    = lazy(() => import('./pages/RouteResults'));
const StationsList    = lazy(() => import('./pages/StationsList'));
const StationDetails  = lazy(() => import('./pages/StationDetails'));
const LiveMonitoring  = lazy(() => import('./pages/LiveMonitoring'));
const CompareStations = lazy(() => import('./pages/CompareStations'));
const Settings        = lazy(() => import('./pages/Settings'));

const PageFallback = () => (
  <div className="flex items-center justify-center h-full min-h-[300px]">
    <LoadingSpinner message="Loading…" />
  </div>
);

function App() {
  return (
    <AppProvider>
      <MainLayout>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/"              element={<Dashboard />} />
            <Route path="/plan"          element={<TripPlanner />} />
            <Route path="/results"       element={<RouteResults />} />
            <Route path="/stations"      element={<StationsList />} />
            <Route path="/stations/:id"  element={<StationDetails />} />
            <Route path="/monitoring"    element={<LiveMonitoring />} />
            <Route path="/compare"       element={<CompareStations />} />
            <Route path="/settings"      element={<Settings />} />
          </Routes>
        </Suspense>
      </MainLayout>
    </AppProvider>
  );
}

export default App;
