"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";

interface Props {
  contractId: string;
  token: string;
  homeownerName: string;
}

export default function ContractSignForm({ contractId, token, homeownerName }: Props) {
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "signed" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSign() {
    if (!name.trim()) { setError("Please enter your full name."); return; }
    setStatus("loading");
    setError("");

    const res = await fetch(`/api/contracts/${contractId}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, signerName: name.trim() }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong. Please try again.");
      setStatus("idle");
      return;
    }

    setStatus("signed");
  }

  if (status === "signed") {
    return (
      <div className="text-center space-y-3 py-4">
        <CheckCircle className="w-10 h-10 text-green-500 mx-auto" />
        <div>
          <p className="font-semibold text-gray-900">Contract Signed!</p>
          <p className="text-sm text-gray-500 mt-1">
            Thank you, {name}. A copy has been sent to the contractor. You&apos;re all set.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-gray-700 mb-1">
          Type your full name to sign
        </p>
        <p className="text-xs text-gray-400 mb-3">
          By signing, you agree to the terms of this contract. This constitutes a legally binding electronic signature under the ESIGN Act.
        </p>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={homeownerName}
          className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
      </div>
      <button
        onClick={handleSign}
        disabled={status === "loading" || !name.trim()}
        className="w-full bg-orange-500 text-white text-sm font-semibold py-3 rounded-xl hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {status === "loading" ? "Signing..." : "Sign Contract"}
      </button>
    </div>
  );
}
