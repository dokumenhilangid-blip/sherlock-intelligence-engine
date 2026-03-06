/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Signals from "./pages/Signals";
import Opportunities from "./pages/Opportunities";
import ToolsDatabase from "./pages/ToolsDatabase";
import RedditInsights from "./pages/RedditInsights";

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/signals" element={<Signals />} />
          <Route path="/opportunities" element={<Opportunities />} />
          <Route path="/tools" element={<ToolsDatabase />} />
          <Route path="/reddit" element={<RedditInsights />} />
        </Routes>
      </Layout>
    </Router>
  );
}
