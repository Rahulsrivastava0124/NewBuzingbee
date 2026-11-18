import { Star } from "lucide-react";

interface StarItemProps {
  text: string;
}

export default function StarItem({ text }: StarItemProps) {
  return (
    <li className="flex items-start gap-3">
      <Star className="w-4 h-4 mt-1 text-accent fill-accent flex-shrink-0" />
      <span className="text-textBody text-sm md:text-base">{text}</span>
    </li>
  );
}
