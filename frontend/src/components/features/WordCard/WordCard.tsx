interface WordCardProps {
  word: string;
  index: number;
  total: number;
}

export function WordCard({ word, index, total }: WordCardProps) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs text-zinc-500 tracking-widest uppercase">
        {index + 1} / {total}
      </span>
      <h1 className="text-5xl font-bold tracking-wide text-zinc-100">
        {word.toUpperCase()}
      </h1>
    </div>
  );
}
