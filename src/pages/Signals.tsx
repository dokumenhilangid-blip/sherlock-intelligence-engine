import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { ExternalLink, Search, Filter } from "lucide-react";

export default function Signals() {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/signals?limit=100")
      .then((res) => res.json())
      .then((data) => {
        setSignals(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Raw Signals</h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search signals..."
              className="pl-9 pr-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
            />
          </div>
          <button className="p-2 bg-white border border-zinc-200 rounded-lg text-zinc-500 hover:text-zinc-900 transition-colors">
            <Filter className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-zinc-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Loading signals...</div>
        ) : signals.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">No signals found.</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {signals.map((signal: any) => (
              <div key={signal.id} className="p-6 hover:bg-zinc-50 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-800 capitalize">
                        {signal.source.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-zinc-500">
                        {formatDistanceToNow(new Date(signal.published_at), { addSuffix: true })}
                      </span>
                      {signal.processed ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                          Analyzed
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 uppercase tracking-wider">
                          Pending
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-zinc-900 leading-tight mb-2">
                      {signal.title}
                    </h3>
                    <p className="text-sm text-zinc-600 line-clamp-2">
                      {signal.content || "No content available."}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <a
                      href={signal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                    {signal.score > 0 && (
                      <div className="text-right">
                        <div className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Score</div>
                        <div className="text-lg font-bold text-indigo-600">{signal.score}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
