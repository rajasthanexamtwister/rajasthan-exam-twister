import { Loader2 } from "lucide-react";

export default function NotesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-amber-500 mb-4" />
      <p className="text-sm font-semibold text-slate-700">Loading revision notes...</p>
      <p className="text-xs text-slate-400 mt-1">Retrieving the latest high-yield study material</p>
    </div>
  );
}
