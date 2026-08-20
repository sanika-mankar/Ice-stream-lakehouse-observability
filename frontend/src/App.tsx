
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";
import QualityPage from "./pages/QualityPage";
import SystemPage from "./pages/SystemPage";
import PipelinePage from "./pages/PipelinePage";
import ReliabilityPage from "./pages/ReliabilityPage";
import LakehousePage from "./pages/LakehousePage";
import ObservabilityPage from "./pages/ObservabilityPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import SecurityAuditPage from "./pages/SecurityAuditPage";
import NetworkMeshPage from "./pages/NetworkMeshPage";
import CloudConfigPage from "./pages/CloudConfigPage";
import { useStore } from "./lib/store/useStore";

function App() {
  const simulateTick = useStore(state => state.simulateTick);

  useEffect(() => {
    const interval = setInterval(() => {
      simulateTick();
    }, 2000);
    return () => clearInterval(interval);
  }, [simulateTick]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<DashboardPage />} />
          <Route path="pipeline/*" element={<PipelinePage />} />
          <Route path="quality/*" element={<QualityPage />} />
          <Route path="reliability/*" element={<ReliabilityPage />} />
          <Route path="lakehouse/*" element={<LakehousePage />} />
          <Route path="observability/*" element={<ObservabilityPage />} />
          <Route path="analytics/*" element={<AnalyticsPage />} />
          <Route path="security/*" element={<SecurityAuditPage />} />
          <Route path="network/*" element={<NetworkMeshPage />} />
          <Route path="cloud/*" element={<CloudConfigPage />} />
          <Route path="system/*" element={<SystemPage />} />
          <Route path="*" element={<div className="p-8">404 Not Found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
