import { useEffect, useState } from "react";
import { Activity, Lightbulb, Database, RefreshCw, Zap } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [stats, setStats] = useState({ signals: 0, opportunities: 0, tools: 0 });
  const [recentSignals, setRecentSignals] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const [sigRes, oppRes, toolRes] = await Promise.all([
        fetch("/api/signals?limit=5"),
        fetch("/api/opportunities?limit=1"),
        fetch("/api/tools?limit=1")
      ]);
      const signals = await sigRes.json();
      const opportunities = await oppRes.json();
      const tools = await toolRes.json();

      setRecentSignals(signals);
      // In a real app, we'd have a stats endpoint. Here we just use the lengths or mock it.
      setStats({
        signals: signals.length > 0 ? signals.length * 12 : 0,
        opportunities: opportunities.length > 0 ? opportunities.length * 5 : 0,
        tools: tools.length > 0 ? tools.length * 8 : 0,
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleScrape = async () => {
    setLoading(true);
    try {
      await fetch("/api/scrape", { method: "POST" });
      await fetch("/api/analyze", { method: "POST" });
      await fetchData();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const chartData = [
    { name: "Mon", signals: 12 },
    { name: "Tue", signals: 19 },
    { name: "Wed", signals: 15 },
    { name: "Thu", signals: 22 },
    { name: "Fri", signals: 30 },
    { name: "Sat", signals: 10 },
    { name: "Sun", signals: 5 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Intelligence Dashboard</h1>
        <button
          onClick={handleScrape}
          disabled={loading}
          className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {loading ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
          Run Pipeline
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-500">Total Signals</h3>
            <Activity className="w-5 h-5 text-indigo-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{stats.signals}</p>
          <p className="mt-1 text-sm text-emerald-600">+12% from last week</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-500">Opportunities Found</h3>
            <Lightbulb className="w-5 h-5 text-amber-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{stats.opportunities}</p>
          <p className="mt-1 text-sm text-emerald-600">+4 new today</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-500">Tools Tracked</h3>
            <Database className="w-5 h-5 text-blue-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{stats.tools}</p>
          <p className="mt-1 text-sm text-zinc-500">Across 15 directories</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <h3 className="text-lg font-semibold text-zinc-900 mb-6">Signal Volume</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="signals" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <h3 className="text-lg font-semibold text-zinc-900 mb-6">Recent Signals</h3>
          <div className="space-y-4">
            {recentSignals.map((signal: any) => (
              <div key={signal.id} className="flex items-start p-4 rounded-xl bg-zinc-50 border border-zinc-100">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-zinc-900 truncate">{signal.title}</p>
                  <div className="mt-1 flex items-center text-xs text-zinc-500 space-x-2">
                    <span className="capitalize">{signal.source.replace('_', ' ')}</span>
                    <span>•</span>
                    <span>{formatDistanceToNow(new Date(signal.published_at), { addSuffix: true })}</span>
                  </div>
                </div>
                {signal.score > 0 && (
                  <div className="ml-4 flex-shrink-0">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                      Score: {signal.score}
                    </span>
                  </div>
                )}
              </div>
            ))}
            {recentSignals.length === 0 && (
              <div className="text-center py-8 text-zinc-500 text-sm">
                No signals found. Run the pipeline to fetch data.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
