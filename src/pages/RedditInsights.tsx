import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, TrendingUp, Users } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function RedditInsights() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/signals?limit=100")
      .then((res) => res.json())
      .then((data) => {
        setSignals(data.filter((s: any) => s.source === "reddit"));
        setLoading(false);
      });
  }, []);

  const chartData = [
    { name: "r/artificial", mentions: 45 },
    { name: "r/MachineLearning", mentions: 32 },
    { name: "r/SideProject", mentions: 28 },
    { name: "r/SaaS", mentions: 15 },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Reddit Insights</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-500">Total Reddit Signals</h3>
            <MessageSquare className="w-5 h-5 text-orange-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">{signals.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-500">Trending Subreddits</h3>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">4</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-zinc-500">Avg Sentiment</h3>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-zinc-900">
            {signals.length > 0 
              ? (signals.reduce((acc: number, s: any) => acc + (s.sentiment || 0), 0) / signals.length).toFixed(2) 
              : "0.00"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <h3 className="text-lg font-semibold text-zinc-900 mb-6">Subreddit Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={120} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
                <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="mentions" fill="#f97316" radius={[0, 4, 4, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-zinc-200">
          <h3 className="text-lg font-semibold text-zinc-900 mb-6">Recent Discussions</h3>
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8 text-zinc-500">Loading Reddit data...</div>
            ) : signals.length === 0 ? (
              <div className="text-center py-8 text-zinc-500">No Reddit signals found.</div>
            ) : (
              signals.slice(0, 5).map((signal: any) => (
                <div key={signal.id} className="p-4 rounded-xl bg-zinc-50 border border-zinc-100 hover:bg-zinc-100 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                      Reddit
                    </span>
                    <span className="text-xs text-zinc-500">
                      {formatDistanceToNow(new Date(signal.published_at), { addSuffix: true })}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-zinc-900 mb-1">{signal.title}</h4>
                  <p className="text-xs text-zinc-600 line-clamp-2">{signal.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
