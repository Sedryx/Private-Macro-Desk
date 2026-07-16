export function LoadingState({ cards = 6 }: { cards?: number }) {
  return (
    <>
      <header className="mb-6 animate-pulse">
        <div className="h-3 w-24 rounded bg-[#1b1f20]" />
        <div className="mt-3 h-7 w-56 rounded bg-[#1b1f20]" />
      </header>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: cards }).map((_, index) => (
          <div key={index} className="desk-surface h-32 animate-pulse bg-[#111214]" />
        ))}
      </div>
    </>
  );
}
