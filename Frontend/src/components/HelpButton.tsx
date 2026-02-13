"use client";

import { Button } from "@/components/ui/button";

const OWNER_PHONE = process.env.NEXT_PUBLIC_OWNER_PHONE || "+79001234567";

export function HelpButton() {
  return (
    <a href={`tel:${OWNER_PHONE}`}>
      <Button variant="outline" size="sm" className="text-sm px-3">
        🆘 Помощь Лизуну
      </Button>
    </a>
  );
}
