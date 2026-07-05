type PlannedListProps = {
  items: string[];
  note: string;
};

export function PlannedList({ items, note }: PlannedListProps) {
  return (
    <div>
      <ul className="space-y-2.5">
        {items.map((item) => (
          <li key={item} className="flex gap-3 text-[13px] leading-5 text-[#a7afab]">
            <span className="mt-2 size-1 shrink-0 rounded-full bg-[#66736a]" />
            {item}
          </li>
        ))}
      </ul>
      <p className="mt-5 border-t border-[var(--line)] pt-4 text-[11px] leading-5 text-[#65706b]">
        {note}
      </p>
    </div>
  );
}
