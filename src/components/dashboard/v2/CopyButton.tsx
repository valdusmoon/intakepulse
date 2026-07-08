"use client";

import { useState } from "react";
import { Button, Icon } from "./primitives";

export function CopyButton({ value, label = "Copy link" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  }

  return (
    <Button variant="primary" onClick={copy}>
      <Icon name={copied ? "check" : "content_copy"} className="!text-base" />
      {copied ? "Copied ✓" : label}
    </Button>
  );
}
