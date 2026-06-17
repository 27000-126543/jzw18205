import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import DataEntry from "@/pages/DataEntry";
import Targets from "@/pages/Targets";
import Analysis from "@/pages/Analysis";
import Measures from "@/pages/Measures";
import Reports from "@/pages/Reports";
import History from "@/pages/History";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/data-entry" element={<DataEntry />} />
          <Route path="/targets" element={<Targets />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/measures" element={<Measures />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/history" element={<History />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
}
