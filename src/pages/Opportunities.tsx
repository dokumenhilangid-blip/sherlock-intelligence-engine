import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Lightbulb, TrendingUp, Target } from "lucide-react";

export default function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/opportunities?limit=50")
      .then((res) => res.json())
      .then((data) => {
        setOpportunities(data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Generated Opportunities</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full p-8 text-center text-zinc-500">Loading opportunities...</div>
        ) : opportunities.length === 0 ? (
          <div className="col-span-full p-8 text-center text-zinc-500">No opportunities generated yet. Run the pipeline.</div>
        ) : (
          opportunities.map((opp: any) => (
            <div key={opp.id} className="bg-white rounded-2xl shadow-sm border border-zinc-200 p-6 flex flex-col hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <Lightbulb className="w-6 h-6 text-indigo-600" />
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  {(opp.confidence * 100).toFixed(0)}% Match
                </span>
              </div>
              <h3 className="text-lg font-bold text-zinc-900 leading-tight mb-2">{opp.title}</h3>
              <p className="text-sm text-zinc-600 flex-1 mb-6 line-clamp-4">{opp.description}</p>
              
              <div className="pt-4 border-t border-zinc-100 flex items-center justify-between mt-auto">
                <div className="flex items-center text-xs font-medium text-zinc-500 uppercase tracking-wider">
                  <Target className="w-4 h-4 mr-1.5" />
                  {opp.category}
                </div>
                <div className="text-xs text-zinc-400">
                  {formatDistanceToNow(new Date(opp.created_at), { addSuffix: true })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
