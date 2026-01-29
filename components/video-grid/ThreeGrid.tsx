interface Props {
  list: string[];
}

export function ThreeGrid({ list }: Props) {
  if (list.length !== 3) return null;
  const [a, b, c] = list;

  return (
    <div className="bg-black  grid grid-flow-col grid-rows-3 gap-4 p-4 w-fit">
      <div className="col-start-1 col-end-2 row-span-1">{a}</div>
      <div className="col-start-2 col-end-3 row-span-1">{b}</div>
      <div className="col-start-1 col-end-3 row-span-2 aspect-video h-[400px]">
        {c}
      </div>
    </div>
  );
}
