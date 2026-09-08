"use client";

import type { ReactNode } from "react";

/** Keep optional fields mounted so collapsing never discards a buyer's draft. */
export default function OptionalInquiryDetails({ title, children }: { title: string; children: ReactNode }) {
  return <details className="optional-inquiry-details" onInvalidCapture={(event) => {
    // Native validation must be able to reveal and focus a field in a closed group.
    event.currentTarget.open = true;
  }}>
    <summary>{title}</summary>
    <div className="optional-inquiry-content">{children}</div>
  </details>;
}
