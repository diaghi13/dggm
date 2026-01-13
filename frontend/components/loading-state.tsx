export function LoadingState({ message = 'Caricamento...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-slate-600 rounded-full animate-spin mb-4" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}
