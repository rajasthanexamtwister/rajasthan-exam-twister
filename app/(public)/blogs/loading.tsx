export default function BlogsLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-3 border-b border-slate-200 pb-8">
        <div className="w-32 h-6 bg-slate-200 rounded-full" />
        <div className="w-80 h-10 bg-slate-200 rounded-xl" />
        <div className="w-96 h-4 bg-slate-200 rounded-lg" />
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-sm"
          >
            <div className="flex justify-between items-center">
              <div className="w-20 h-4 bg-slate-200 rounded" />
              <div className="w-24 h-4 bg-slate-200 rounded" />
            </div>
            <div className="w-full h-6 bg-slate-200 rounded-lg" />
            <div className="w-3/4 h-6 bg-slate-200 rounded-lg" />
            <div className="space-y-2 pt-2">
              <div className="w-full h-3 bg-slate-100 rounded" />
              <div className="w-5/6 h-3 bg-slate-100 rounded" />
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-between items-center">
              <div className="w-16 h-4 bg-slate-200 rounded" />
              <div className="w-20 h-4 bg-slate-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
