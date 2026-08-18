
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import DashboardPage from "./pages/DashboardPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<DashboardPage />} />
          <Route path="pipeline/*" element={<div className="p-8">Pipeline (WIP)</div>} />
          <Route path="quality/*" element={<div className="p-8">Data Quality (WIP)</div>} />
          <Route path="reliability/*" element={<div className="p-8">Reliability (WIP)</div>} />
          <Route path="lakehouse/*" element={<div className="p-8">Lakehouse (WIP)</div>} />
          <Route path="observability/*" element={<div className="p-8">Observability (WIP)</div>} />
          <Route path="system/*" element={<div className="p-8">System (WIP)</div>} />
          <Route path="*" element={<div className="p-8">404 Not Found</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
