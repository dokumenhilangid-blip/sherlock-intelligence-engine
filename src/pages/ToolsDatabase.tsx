import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Database, ExternalLink, Search, Filter } from "lucide-react";

export default function ToolsDatabase() {
  const [tools, setTools] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tools?limit=100")
      .then((res) => res.json())
      .then((data) => {
        setTools(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">AI Tools Database</h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search tools..."
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
          <div className="p-8 text-center text-zinc-500">Loading tools...</div>
        ) : tools.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">No tools found. Run the pipeline.</div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {tools.map((tool: any) => (
              <div key={tool.id} className="p-6 hover:bg-zinc-50 transition-colors group">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0 pr-6">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                        {tool.category || "Unknown"}
                      </span>
                      <span className="text-xs text-zinc-500">
                        Added {formatDistanceToNow(new Date(tool.added_at), { addSuffix: true })}
                      </span>
                      <span className="text-xs text-zinc-400">
                        Source: {tool.source.replace('_', ' ')}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-zinc-900 leading-tight mb-2">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-zinc-600 line-clamp-2">
                      {tool.description || "No description available."}
                    </p>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <a
                      href={tool.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
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
