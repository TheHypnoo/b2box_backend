import { Text } from "@medusajs/ui";
import { ReactNode } from "react";

export default function SectionRow({
  title,
  value,
}: {
  title: string;
  value: string | ReactNode;
}): ReactNode {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-6 py-4">
      <Text size="small" color="secondary" className="min-w-0 flex-shrink-0">
        {title}
      </Text>
      <div className="min-w-0 flex-1 sm:text-right">
        {typeof value === "string" ? (
          <Text size="small" className="break-words">
            {value || "—"}
          </Text>
        ) : (
          <div className="break-words">{value}</div>
        )}
      </div>
    </div>
  );
}
