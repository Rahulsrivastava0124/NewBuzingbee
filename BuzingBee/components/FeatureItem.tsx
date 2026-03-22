import { CheckCircle2 } from "lucide-react";

interface FeatureItemProps {
  text: string;
}

export default function FeatureItem({ text }: FeatureItemProps) {
  return (
    <li className="flex items-start gap-3">
      <CheckCircle2 className="w-5 h-5 mt-0.5 text-accent flex-shrink-0" />
      <span className="text-textBody text-sm">{text}</span>
    </li>
  );
}
