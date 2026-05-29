"use client";

import { useState } from "react";
import { CheckCircle, XCircle } from "lucide-react";

interface Props {
  quoteId: string;
  token: string;
}

type State = "idle" | "declining" | "loading" | "accepted" | "declined" | "error";

export default function QuoteRespondForm({ quoteId, token }: Props) {
  const [state, setState] = useState<State>("idle");
  const [declineReason, setDeclineReason] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  async function respond(action: "accept" | "decline") {
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/quotes/${quoteId}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, action, reason: action === "decline" ? declineReason : undefined }),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrorMsg(data.error ?? "Something went wrong. Please try again.");
        setState("idle");
        return;
      }

      setState(action === "accept" ? "accepted" : "declined");
    } catch {
      setErrorMsg("Network error. Please try again.");
      setState("idle");
    }
  }

  if (state === "accepted") {
    return (
      <div className="text-center space-y-3 py-2">
        <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
        <div>
          <p className="font-semibold text-gray-900">Quote Accepted!</p>
          <p className="text-sm text-gray-500 mt-1">
            We&apos;ll be in touch shortly to collect your deposit and schedule the job.
          </p>
        </div>
      </div>
    );
  }

  if (state === "declined") {
    return (
      <div className="text-center space-y-3 py-2">
        <XCircle className="w-10 h-10 text-gray-400 mx-auto" />
        <div>
          <p className="font-semibold text-gray-700">Quote Declined</p>
          <p className="text-sm text-gray-400 mt-1">Thank you for letting us know.</p>
        </div>
      </div>
    );
  }

  if (state === "declining") {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium text-gray-700">Reason for declining <span className="text-gray-400 font-normal">(optional)</span></p>
        <textarea
          value={declineReason}
          onChange={(e) => setDeclineReason(e.target.value)}
          rows={3}
          placeholder="e.g. Going with another contractor, price too high, project postponed..."
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setState("idle")}
            className="flex-1 border border-gray-200 text-gray-500 text-sm py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => respond("decline")}
            className="flex-1 bg-gray-800 text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-gray-700 transition-colors"
          >
            Confirm Decline
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {errorMsg && (
        <p className="text-xs text-red-500 text-center">{errorMsg}</p>
      )}
      <button
        onClick={() => respond("accept")}
        disabled={state === "loading"}
        className="w-full bg-orange-500 text-white text-sm font-semibold py-3 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {state === "loading" ? "Processing..." : "Accept Quote"}
      </button>
      <button
        onClick={() => setState("declining")}
        disabled={state === "loading"}
        className="w-full border border-gray-200 text-gray-500 text-sm py-2.5 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
      >
        Decline
      </button>
    </div>
  );
}
