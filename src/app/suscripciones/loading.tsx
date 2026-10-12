export default function SuscripcionesLoading() {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="h-10 w-64 rounded-xl bg-card animate-pulse border border-white/10" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-card animate-pulse border border-white/10" />
        ))}
      </div>
      <div className="h-12 w-full rounded-2xl bg-card animate-pulse border border-white/10" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 rounded-2xl bg-card animate-pulse border border-white/10" />
        ))}
      </div>
    </div>
  );
}
