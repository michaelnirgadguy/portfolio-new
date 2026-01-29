import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface Props {
  list: ReactNode[];
  className?: string;
}

export function TwoGrid({ className, list }: Props) {
  if (list.length !== 2) return null;
  const [a, b] = list;

  return (
    <div className={cn("flex flex-col gap-4 p-4 ", className)}>
      <div className="flex-1 aspect-video w-fit">{a}</div>
      <div className="flex-1 aspect-video w-fit">{b}</div>
    </div>
  );
}
