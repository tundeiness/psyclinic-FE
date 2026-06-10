"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, Button, Alert, Field } from "@/components/ui";
import { useRequireRole } from "@/lib/useRequireRole";
import {
  fetchContractStatus,
  signContract,
  uploadSignedContract,
  downloadContractPdf,
  ContractStatus,
} from "@/lib/clientApi";
import { isApiError } from "@/lib/apiError";
import { ContractFullText } from "@/components/ContractFullText";

export default function ContractPage() {
  const { ready } = useRequireRole("client");
  const router = useRouter();
  const [status, setStatus] = useState<ContractStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [typedName, setTypedName] = useState("");
  const [sponsorName, setSponsorName] = useState("");
  const [sponsorSig, setSponsorSig] = useState("");
  const [busy, setBusy] = useState<"signing" | "uploading" | "downloading" | null>(null);

  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const s = await fetchContractStatus();
      setStatus(s);
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load contract status.");
    }
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  async function onDownload() {
    setBusy("downloading");
    try {
      const blob = await downloadContractPdf();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "cerca-africa-contract.pdf";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Revoke after a tick so the click has time to fire.
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not download PDF.");
    } finally {
      setBusy(null);
    }
  }

  async function onSign() {
    setBusy("signing");
    setError(null);
    try {
      await signContract({
        typed_name: typedName.trim(),
        sponsor_name: sponsorName.trim() || undefined,
        sponsor_signature_typed: sponsorSig.trim() || undefined,
      });
      router.push("/dashboard?contract_signed=1");
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not sign.");
      setBusy(null);
    }
  }

  async function onUpload() {
    if (!uploadFile) {
      setError("Choose a file to upload.");
      return;
    }
    setBusy("uploading");
    setError(null);
    try {
      await uploadSignedContract({
        file: uploadFile,
        sponsor_name: sponsorName.trim() || undefined,
      });
      router.push("/dashboard?contract_uploaded=1");
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not upload.");
      setBusy(null);
    }
  }

  if (!ready || !status) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  // Already signed and valid — show the success state.
  if (status.signed_contract?.valid_for_use) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <Alert kind="success">
          Your services contract is signed and on file
          {status.signed_contract.signature_method === "electronic"
            ? " (electronic signature)."
            : " (verified by clinic staff)."}
        </Alert>
        <div className="mt-5">
          <Link
            href="/buy-block"
            className="text-base font-semibold text-brand-700 no-underline hover:text-brand-800"
          >
            Continue to buy a session block →
          </Link>
        </div>
      </main>
    );
  }

  // Has pending upload waiting on certification.
  if (status.pending_contract) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <Alert kind="info">
          Your uploaded signed contract is awaiting verification by
          clinic staff. You&apos;ll be able to purchase a session block
          once it&apos;s verified — usually within one business day.
        </Alert>
        <Link
          href="/dashboard"
          className="mt-5 inline-block text-base font-semibold text-brand-700 no-underline hover:text-brand-800"
        >
          ← Back to dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-5 py-8">
      <h1 className="mb-1 text-xl font-semibold text-brand-700 sm:text-2xl">
        Client services contract
      </h1>
      <p className="mb-6 text-sm text-slate-600">
        Before purchasing a session block, please read and sign the
        clinic&apos;s services contract.
      </p>

      {error && <Alert kind="error">{error}</Alert>}

      <ContractSummary />

      <Card className="mt-5">
        <details className="group">
          <summary className="flex cursor-pointer items-center justify-between text-base font-semibold text-slate-800">
            <span>Read the full contract</span>
            <span className="text-xs font-normal text-slate-500 group-open:hidden">
              Click to expand
            </span>
            <span className="hidden text-xs font-normal text-slate-500 group-open:inline">
              Click to collapse
            </span>
          </summary>
          <div className="mt-4 border-t border-slate-200 pt-4">
            <ContractFullText />
          </div>
        </details>
      </Card>

      <Card className="mt-5">
        <h2 className="text-base font-semibold text-slate-800">
          Want a copy?
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Download a personalized PDF with your name pre-filled. This
          is the canonical version of the contract you&apos;re
          agreeing to.
        </p>
        <Button
          variant="ghost"
          onClick={onDownload}
          loading={busy === "downloading"}
          disabled={busy !== null}
          className="mt-3 !w-auto"
        >
          Download PDF
        </Button>
      </Card>

      <Card className="mt-5">
        <h2 className="text-base font-semibold text-slate-800">
          Sign electronically
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Type your full legal name to sign. By signing, you confirm
          you have read the contract and agree to its terms.
        </p>

        <div className="mt-4 space-y-3">
          <Field
            id="typed_name"
            label="Your full name (as it appears on your profile)"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            placeholder="e.g. John Smith"
          />
          <Field
            id="sponsor_name"
            label="Sponsor's name (required if you are a minor)"
            value={sponsorName}
            onChange={(e) => setSponsorName(e.target.value)}
            placeholder="Leave blank if not applicable"
          />
          {sponsorName.trim() && (
            <Field
              id="sponsor_sig"
              label="Sponsor's typed signature"
              value={sponsorSig}
              onChange={(e) => setSponsorSig(e.target.value)}
              placeholder="Sponsor types their full name"
            />
          )}

          <Button
            onClick={onSign}
            loading={busy === "signing"}
            disabled={busy !== null || !typedName.trim()}
          >
            Sign electronically
          </Button>
        </div>
      </Card>

      <Card className="mt-5">
        <h2 className="text-base font-semibold text-slate-800">
          Or upload a signed copy
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Download the PDF, print and sign by hand, then upload a scan
          or photo. Clinic staff will verify before your block can be
          purchased.
        </p>
        {!showUpload ? (
          <Button
            variant="ghost"
            onClick={() => setShowUpload(true)}
            className="mt-3 !w-auto"
          >
            Upload signed copy
          </Button>
        ) : (
          <div className="mt-4 space-y-3">
            <input
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-xl file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
            />
            <p className="text-xs text-slate-500">
              Accepted: PDF, PNG, JPEG. Max 10 MB.
            </p>
            <Button
              onClick={onUpload}
              loading={busy === "uploading"}
              disabled={busy !== null || !uploadFile}
            >
              Upload
            </Button>
          </div>
        )}
      </Card>
    </main>
  );
}

// Inline summary of the key terms so clients can read at a glance
// without downloading the PDF. The PDF is the canonical version;
// this is for skimmable convenience.
function ContractSummary() {
  return (
    <Card>
      <h2 className="text-base font-semibold text-slate-800">
        Summary of terms
      </h2>
      <ul className="mt-3 space-y-2 text-sm text-slate-700">
        <li>
          <strong>Sessions:</strong> 45–60 minutes, typically weekly at the
          same time.
        </li>
        <li>
          <strong>Rescheduling:</strong> at least 24 hours before. No-shows
          count as held.
        </li>
        <li>
          <strong>Fees:</strong> ₦50,000 per assessment; block of 6
          sessions at ₦300,000 (full pay) or 60/40 installment.
        </li>
        <li>
          <strong>Block expiry:</strong> unattended sessions expire 6 weeks
          after your last attended session.
        </li>
        <li>
          <strong>Confidentiality:</strong> protected by law, with
          exceptions for danger to self/others, court orders, and abuse
          reporting.
        </li>
        <li>
          <strong>Refunds:</strong> non-refundable except where the
          clinician is unable to provide paid-for services.
        </li>
      </ul>
      <p className="mt-4 text-xs text-slate-500">
        This is a summary only. The full contract is the canonical
        document — please download and read it before signing.
      </p>
    </Card>
  );
}
