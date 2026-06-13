"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppSelector } from "@/store";
import { Card, Button, Alert } from "@/components/ui";
import { fetchAppointments, fetchSessionBlocks, fetchContractStatus, payInstallment, Appointment, SessionBlock, ContractStatus } from "@/lib/clientApi";
import { isApiError } from "@/lib/apiError";
import { formatDateTime, formatNaira } from "@/lib/format";
import { ExpiryCountdown } from "@/components/ExpiryCountdown";

export default function DashboardPage() {
  const router = useRouter();
  const { user, initialized } = useAppSelector((s) => s.auth);

  useEffect(() => {
    if (initialized && !user) router.push("/login");
  }, [initialized, user, router]);

  // Auth state lives only on the client (token in localStorage). On the
  // server, `user` is always null and `initialized` is false. We render
  // nothing on the server so the client's first render — which may have
  // a user — doesn't diverge from the SSR output. Without this guard,
  // hydration mismatches can leave the page painted-but-non-interactive.
  if (!initialized || !user) {
    return (
      <main className="mx-auto max-w-3xl px-5 py-10">
        <p className="text-sm text-slate-500">Loading…</p>
      </main>
    );
  }

  // Role-aware welcome heading + action set.
  const isCoAdmin = user.role === "therapist" && user.therapist_profile?.co_admin === true;
  const banners = {
    client: {
      tag: "Client",
      greeting: `Welcome, ${user.full_name.split(" ")[0]}`,
      tagline: "Book a session, manage your appointments, and update your profile.",
    },
    therapist: {
      tag: isCoAdmin ? "Therapist · Co-admin" : "Therapist",
      greeting: `Welcome, ${user.full_name.split(" ")[0]}`,
      tagline: isCoAdmin
        ? "Your schedule, your clients, and admin tools the admin granted you."
        : "Manage your schedule, your clients and clinical notes.",
    },
    admin: {
      tag: "Admin",
      greeting: `Welcome back, ${user.full_name.split(" ")[0]}`,
      tagline: "Oversee the practice — applications, users and payment inflows.",
    },
  };
  // Defensive fallback: if the role is unexpected (or undefined), fall
  // back to a neutral banner rather than crashing mid-render — which
  // would leave React in an inconsistent state.
  const banner = banners[user.role as keyof typeof banners] ?? {
    tag: "Signed in",
    greeting: `Welcome, ${user.full_name.split(" ")[0]}`,
    tagline: "",
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="mb-6 overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-700 to-slate-800 p-6 text-white shadow-soft sm:p-8">
        <p className="text-xs font-medium uppercase tracking-wider text-white/70">
          {banner.tag}
        </p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          {banner.greeting}
        </h1>
        <p className="mt-1 max-w-xl text-sm text-white/80">{banner.tagline}</p>
      </div>

      {user.role === "client" && (
        <>
          <ClientPendingPayments />
          <ClientContractStatusPanel />
          <ClientSessionBlockPanel />
          <ClientUpNextPanel />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-indigo-600">
              Book a session
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Pick a date and a therapist. The first session with a new
              therapist is an <strong>assessment session</strong>.
            </p>
            <Link href="/book" className="mt-4 inline-block">
              <Button className="!w-auto">Go to booking</Button>
            </Link>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-amber-600">
              Buy a block
            </p>
            <p className="mt-2 text-sm text-slate-600">
              6 sessions with your current therapist. Required after
              your assessment.
            </p>
            <Link href="/buy-block" className="mt-4 inline-block">
              <Button variant="ghost" className="!w-auto">
                Open
              </Button>
            </Link>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-violet-600">
              My appointments
            </p>
            <p className="mt-2 text-sm text-slate-600">
              See or cancel upcoming sessions.
            </p>
            <Link href="/appointments" className="mt-4 inline-block">
              <Button variant="ghost" className="!w-auto">
                Open
              </Button>
            </Link>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-cyan-600">
              Profile
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Update your avatar and documents.
            </p>
            <Link href="/profile" className="mt-4 inline-block">
              <Button variant="ghost" className="!w-auto">
                Edit profile
              </Button>
            </Link>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-emerald-600">
              Therapists
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Browse our team or switch to a different therapist.
            </p>
            <Link href="/therapists" className="mt-4 inline-block">
              <Button variant="ghost" className="!w-auto">
                View team
              </Button>
            </Link>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-violet-600">
              DASS-42
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Self-report screening for depression, anxiety, and stress.
              5-10 minutes.
            </p>
            <Link href="/dass" className="mt-4 inline-block">
              <Button variant="ghost" className="!w-auto">
                Open
              </Button>
            </Link>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-violet-600">
              Wheel of Life
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Reflect on 9 life areas. 10-15 minutes.
            </p>
            <Link href="/wheel-of-life" className="mt-4 inline-block">
              <Button variant="ghost" className="!w-auto">
                Open
              </Button>
            </Link>
          </Card>
          </div>
        </>
      )}

      {user.role === "therapist" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-indigo-600">
              My schedule
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Manage availability and see appointments.
            </p>
            <Link href="/therapist" className="mt-4 inline-block">
              <Button className="!w-auto">Open</Button>
            </Link>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-violet-600">
              My clients
            </p>
            <p className="mt-2 text-sm text-slate-600">
              View profiles and write private clinical notes.
            </p>
            <Link href="/therapist/clients" className="mt-4 inline-block">
              <Button variant="ghost" className="!w-auto">
                Open
              </Button>
            </Link>
          </Card>
          {isCoAdmin && (
            <Card className="ring-2 ring-accent-amber-500/30">
              <p className="text-xs font-medium uppercase tracking-wide text-accent-amber-600">
                Co-admin tools
              </p>
              <p className="mt-2 text-sm text-slate-600">
                You have admin powers granted by the admin.
              </p>
              <Link href="/admin" className="mt-4 inline-block">
                <Button variant="ghost" className="!w-auto">
                  Admin workspace
                </Button>
              </Link>
            </Card>
          )}
        </div>
      )}

      {user.role === "admin" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-indigo-600">
              Dashboard
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Counts, inflows, pending applications, calendar.
            </p>
            <Link href="/admin" className="mt-4 inline-block">
              <Button className="!w-auto">Open</Button>
            </Link>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-violet-600">
              People
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Manage clients, therapists and co-admins.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/admin/clients">
                <Button variant="ghost" className="!w-auto">
                  Clients
                </Button>
              </Link>
              <Link href="/admin/therapists">
                <Button variant="ghost" className="!w-auto">
                  Therapists
                </Button>
              </Link>
            </div>
          </Card>
          <Card>
            <p className="text-xs font-medium uppercase tracking-wide text-accent-cyan-600">
              Settings
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Practice-wide flat rate.
            </p>
            <Link href="/admin/settings" className="mt-4 inline-block">
              <Button variant="ghost" className="!w-auto">
                Open
              </Button>
            </Link>
          </Card>
        </div>
      )}
    </main>
  );
}

// Pending-payments panel for clients. If they closed the checkout
// page mid-flow (or the page errored), their appointment is stuck in
// :pending_payment. Surface those with a "Resume" link to the
// checkout. Renders nothing when no pending payments — no empty box
// cluttering the dashboard.
function ClientPendingPayments() {
  const [pending, setPending] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const all = await fetchAppointments();
      setPending(all.filter((a) => a.status === "pending_payment"));
    } catch (e) {
      setError(
        isApiError(e) ? e.message : "Could not load pending payments."
      );
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="mb-4">
        <Alert kind="error">{error}</Alert>
      </div>
    );
  }

  if (!pending || pending.length === 0) return null;

  return (
    <Card className="mb-4 bg-amber-50/50 ring-1 ring-amber-100">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-800">
        Pending payments
      </h2>
      <p className="mt-1 text-sm text-amber-900/80">
        You have {pending.length} session
        {pending.length === 1 ? "" : "s"} awaiting payment. Until paid,
        the slot is reserved but not confirmed.
      </p>
      <ul className="mt-3 divide-y divide-amber-100">
        {pending.map((appt) => {
          const intent = appt.payment?.provider_reference ?? "";
          const canResume =
            intent.length > 0 && appt.payment?.id !== undefined;
          return (
            <li
              key={appt.id}
              className="flex items-center justify-between gap-3 py-2"
            >
              <div>
                <p className="text-sm font-medium text-slate-800">
                  {appt.therapist.name}
                </p>
                <p className="text-xs text-slate-600">
                  {formatDateTime(appt.slot.starts_at)}
                </p>
                {appt.payment && (
                  <p className="text-xs text-slate-500">
                    Due: {formatNaira(appt.payment.amount_cents)}
                  </p>
                )}
                {appt.payment?.expires_at && (
                  <p className="mt-1">
                    <ExpiryCountdown expiresAt={appt.payment.expires_at} />
                  </p>
                )}
              </div>
              {canResume ? (
                <Link
                  href={`/checkout/${encodeURIComponent(intent)}?appointment=${appt.id}&payment=${appt.payment!.id}`}
                  className="rounded-xl bg-amber-200 px-3 py-1.5 text-xs font-semibold text-amber-900 no-underline transition hover:bg-amber-300"
                >
                  Resume payment →
                </Link>
              ) : (
                <span className="text-xs text-slate-500">
                  No payment context
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

// Block status panel for clients. Shows:
//  - "Active block: N of 6 sessions remaining" if they have one
//  - "Buy a block to continue" call-to-action after their assessment
//    (current_therapist set, but no active block)
//  - Nothing if they haven't done an assessment yet (in which case
//    the "Book a session" card already invites them to the
//    assessment).
function ClientSessionBlockPanel() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<SessionBlock[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const list = await fetchSessionBlocks();
      setBlocks(list);
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load blocks.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function onPayInstallment(blockId: number) {
    setBusyId(blockId);
    setError(null);
    try {
      const { payment } = await payInstallment(blockId);
      const intent = payment.provider_reference;
      if (!intent) {
        setError("Installment created but no payment intent was returned.");
        setBusyId(null);
        return;
      }
      router.push(
        `/checkout/${encodeURIComponent(intent)}?block=${blockId}&payment=${payment.id}`
      );
    } catch (e) {
      setError(
        isApiError(e) ? e.message : "Could not start the installment payment."
      );
      setBusyId(null);
    }
  }

  if (error) {
    return (
      <div className="mb-4">
        <Alert kind="error">{error}</Alert>
      </div>
    );
  }
  if (!blocks) return null;

  const active = blocks.find(
    (b) =>
      b.status === "active" &&
      b.sessions_remaining > 0 &&
      b.first_payment_status === "succeeded"
  );

  if (active) {
    return (
      <Card className="mb-4 bg-emerald-50/50 ring-1 ring-emerald-100">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-800">
          Active session block
        </h2>
        <p className="mt-1 text-sm text-emerald-900/80">
          <strong>{active.sessions_remaining}</strong> of{" "}
          {active.sessions_total} sessions remaining with{" "}
          {active.therapist_name ?? "your therapist"}.
        </p>
        {/* Phase 13: 6-week expiry countdown. Same component used for
            pending-payment expiry in Phase 7.1 — scale="long" switches
            it to days/weeks. */}
        {active.expires_at && (
          <div className="mt-2">
            <ExpiryCountdown
              expiresAt={active.expires_at}
              scale="long"
              label="Block expires"
            />
          </div>
        )}
        {active.installment_due && (
          <div className="mt-3 rounded-xl bg-amber-100/70 p-3">
            <p className="text-sm font-semibold text-amber-900">
              Installment due
            </p>
            <p className="mt-1 text-xs text-amber-900/80">
              You&apos;ve used 3 sessions on your installment plan. Pay
              the remaining 40% to book more sessions.
            </p>
            <button
              type="button"
              onClick={() => onPayInstallment(active.id)}
              disabled={busyId !== null}
              className="mt-3 rounded-xl bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
            >
              {busyId === active.id ? "Starting…" : "Pay remaining now"}
            </button>
          </div>
        )}
        {/* Phase 14: contextual switch entry point. Tiny, low-key —
            don't encourage switching, but make it findable for the
            client who wants it. */}
        <div className="mt-3 text-xs">
          <Link
            href="/therapists"
            className="text-emerald-700/70 underline decoration-emerald-300 underline-offset-2 hover:text-emerald-900"
          >
            Considering a different therapist?
          </Link>
        </div>
      </Card>
    );
  }

  // Phase 13: if no active block but a recently-expired one, show
  // the "your block expired" state with a CTA to buy a new one.
  // Find the most recently-purchased expired block.
  const mostRecentExpired = blocks
    .filter((b) => b.status === "expired" || b.expired)
    .sort(
      (a, b) =>
        new Date(b.purchased_at).getTime() -
        new Date(a.purchased_at).getTime()
    )[0];

  if (mostRecentExpired) {
    return (
      <Card className="mb-4 bg-rose-50/50 ring-1 ring-rose-100 animate-in fade-in slide-in-from-top-1 duration-300">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-800">
          Your session block has expired
        </h2>
        <p className="mt-1 text-sm text-rose-900/80">
          Per the clinic&apos;s policy, unattended sessions expire 6
          weeks after your last attended session.
          {mostRecentExpired.sessions_remaining > 0 && (
            <>
              {" "}
              <strong>{mostRecentExpired.sessions_remaining}</strong>{" "}
              unused session
              {mostRecentExpired.sessions_remaining === 1 ? "" : "s"}{" "}
              were forfeited.
            </>
          )}
        </p>
        <Link
          href="/buy-block"
          className="mt-3 inline-block rounded-xl bg-rose-500 px-3 py-1.5 text-sm font-semibold text-white no-underline transition hover:bg-rose-600"
        >
          Purchase a new block →
        </Link>
      </Card>
    );
  }

  return null;
}

// Contract-status panel. Shown to clients who have completed at least
// one appointment (i.e. have a current_therapist set) but haven't yet
// signed the current contract version. Renders nothing for clients
// whose contract is signed and valid, OR who haven't yet had an
// assessment session (they'll be prompted to sign after assessment,
// not before it).
function ClientContractStatusPanel() {
  const { user } = useAppSelector((s) => s.auth);
  const currentTherapistId =
    user?.client_profile?.current_therapist_id ?? null;

  const [status, setStatus] = useState<ContractStatus | null>(null);
  const [appts, setAppts] = useState<Appointment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [s, a] = await Promise.all([
        fetchContractStatus(),
        fetchAppointments(),
      ]);
      setStatus(s);
      setAppts(a);
    } catch (e) {
      setError(isApiError(e) ? e.message : "Could not load contract status.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <div className="mb-4">
        <Alert kind="error">{error}</Alert>
      </div>
    );
  }
  if (!status || !appts) return null;
  if (status.signed_contract?.valid_for_use) return null;

  // Show the panel once the client has financially committed to the
  // clinic in any way. Two durable signals:
  //   - current_therapist_id is set (paid for an assessment OR went
  //     through Phase 14 switching)
  //   - has any appointment that isn't a pure payment failure
  //     (booked, completed, no_show, OR cancelled — anything paid)
  //
  // Earlier this filter only checked booked/completed, which made the
  // panel blink off when the user cancelled all upcoming appointments
  // (e.g. as a precondition to switching therapists). Cancelling is
  // not "I'm no longer with the clinic" — they still owe their unpaid
  // contract obligation.
  const hasAnyCommitment =
    currentTherapistId !== null ||
    appts.some(
      (a) =>
        a.status === "booked" ||
        a.status === "completed" ||
        a.status === "no_show" ||
        a.status === "cancelled"
    );
  if (!hasAnyCommitment) return null;

  if (status.pending_contract) {
    return (
      <Card className="mb-4 bg-sky-50/50 ring-1 ring-sky-100">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-sky-800">
          Contract awaiting verification
        </h2>
        <p className="mt-1 text-sm text-sky-900/80">
          You&apos;ve uploaded your signed contract. Clinic staff will
          verify it within one business day. You can&apos;t purchase a
          session block until verification is complete.
        </p>
      </Card>
    );
  }

  return (
    <Card className="mb-4 bg-amber-50/50 ring-1 ring-amber-100">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-amber-800">
        Sign your services contract
      </h2>
      <p className="mt-1 text-sm text-amber-900/80">
        Before buying a session block, you need to sign the clinic&apos;s
        services contract. Takes about a minute.
      </p>
      <Link
        href="/contract"
        className="mt-3 inline-block rounded-xl bg-amber-500 px-3 py-1.5 text-sm font-semibold text-white no-underline transition hover:bg-amber-600"
      >
        Review &amp; sign →
      </Link>
    </Card>
  );
}

// Phase 14 polish: an "Up next" panel that detects the client's state
// and surfaces the single next concrete step. Without this, clients
// landing on the dashboard after a switch (or any cold-start state)
// see four generic nav tiles but no breadcrumb. With it, they always
// know what to click.
//
// The panel renders nothing when the client is in a "stable" state —
// active block, or a recently expired block (those have their own
// dedicated panels). It only fills the gap states.
//
// State precedence (we surface the FIRST matching one):
//   1. No current_therapist_id → "Choose a therapist"
//   2. Contract not signed → handled by ClientContractStatusPanel; we skip
//   3. Pending-payment assessment → "Complete your assessment payment"
//      (also handled by ClientPendingPayments; we skip if so)
//   4. Booked assessment in the future → "Your assessment is scheduled"
//   5. No assessment booked yet with current therapist → "Book your
//      assessment session with X"
//   6. Assessment completed, no active block → "Purchase a block"
//   7. Otherwise (active block or expired-block panels are showing) →
//      render nothing.
function ClientUpNextPanel() {
  const { user } = useAppSelector((s) => s.auth);
  const currentTherapistId =
    user?.client_profile?.current_therapist_id ?? null;

  const [appts, setAppts] = useState<Appointment[] | null>(null);
  const [blocks, setBlocks] = useState<SessionBlock[] | null>(null);
  const [contract, setContract] = useState<ContractStatus | null>(null);

  const load = useCallback(async () => {
    try {
      const [a, b, c] = await Promise.all([
        fetchAppointments(),
        fetchSessionBlocks(),
        fetchContractStatus(),
      ]);
      setAppts(a);
      setBlocks(b);
      setContract(c);
    } catch {
      // Silent: this is decorative guidance, not a critical surface.
      // The other panels handle their own errors.
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!appts || !blocks || !contract) return null;

  // Bail if there's an active or expired block — those already have
  // dedicated dashboard panels that explain next steps.
  const hasActiveBlock = blocks.some(
    (b) =>
      b.status === "active" &&
      b.sessions_remaining > 0 &&
      b.first_payment_status === "succeeded" &&
      !b.expired
  );
  const hasRecentlyExpiredBlock = blocks.some(
    (b) => b.status === "expired" || b.expired
  );
  if (hasActiveBlock || hasRecentlyExpiredBlock) return null;

  // Bail if contract panel is going to handle the messaging (i.e.
  // they have ANY commitment AND haven't signed). Same trigger logic
  // as ClientContractStatusPanel for consistency.
  const hasAnyCommitment =
    currentTherapistId !== null ||
    appts.some(
      (a) =>
        a.status === "booked" ||
        a.status === "completed" ||
        a.status === "no_show" ||
        a.status === "cancelled"
    );
  const contractSigned = contract.signed_contract?.valid_for_use === true;
  if (hasAnyCommitment && !contractSigned) return null;

  // Bail if ClientPendingPayments is going to nudge for an unpaid
  // assessment — overlapping prompts would be noise.
  const hasPendingPayment = appts.some((a) => a.status === "pending_payment");
  if (hasPendingPayment) return null;

  // ── State #1: no current therapist
  if (!currentTherapistId) {
    return (
      <Card className="mb-4 bg-brand-50/60 ring-1 ring-brand-100 animate-in fade-in slide-in-from-top-1 duration-300">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
          Up next
        </p>
        <h2 className="mt-1 text-base font-semibold text-slate-800">
          Choose a therapist to begin
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Browse our team and pick the therapist you&apos;d like to work
          with. Your first session will be an assessment.
        </p>
        <Link
          href="/therapists"
          className="mt-3 inline-block rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white no-underline transition hover:bg-brand-700"
        >
          View team →
        </Link>
      </Card>
    );
  }

  // ── States 4, 5, 6: client has a therapist + signed contract.
  // Distinguish by their appointment history WITH THAT THERAPIST.
  const withCurrent = appts.filter(
    (a) => a.therapist.id === currentTherapistId
  );

  const futureBookedAssessment = withCurrent.find(
    (a) =>
      a.status === "booked" &&
      a.session_kind === "assessment" &&
      new Date(a.slot.starts_at).getTime() > Date.now()
  );
  const hasCompletedAssessment = withCurrent.some(
    (a) => a.session_kind === "assessment" && a.status === "completed"
  );

  // ── State #4: assessment is booked and upcoming
  if (futureBookedAssessment) {
    const when = new Date(
      futureBookedAssessment.slot.starts_at
    ).toLocaleString(undefined, {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    return (
      <Card className="mb-4 bg-emerald-50/60 ring-1 ring-emerald-100 animate-in fade-in slide-in-from-top-1 duration-300">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Up next
        </p>
        <h2 className="mt-1 text-base font-semibold text-slate-800">
          Your assessment is scheduled
        </h2>
        <p className="mt-1 text-sm text-slate-700">
          {when} with{" "}
          <strong>{futureBookedAssessment.therapist.name}</strong>. After
          the assessment you&apos;ll be able to purchase a 6-session block.
        </p>
        <Link
          href="/appointments"
          className="mt-3 inline-block rounded-xl border border-emerald-200 px-3 py-1.5 text-sm font-semibold text-emerald-800 no-underline transition hover:bg-emerald-100"
        >
          View appointments →
        </Link>
      </Card>
    );
  }

  // ── State #6: assessment completed, no active block — buy one
  if (hasCompletedAssessment) {
    return (
      <Card className="mb-4 bg-accent-violet-50 ring-1 ring-accent-violet-500/20 animate-in fade-in slide-in-from-top-1 duration-300">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent-violet-600">
          Up next
        </p>
        <h2 className="mt-1 text-base font-semibold text-slate-800">
          Purchase your session block
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Your assessment is complete. Buy a 6-session block to continue
          therapy.
        </p>
        <Link
          href="/buy-block"
          className="mt-3 inline-block rounded-xl bg-accent-violet-500 px-3 py-1.5 text-sm font-semibold text-white no-underline transition hover:bg-accent-violet-600"
        >
          Buy a block →
        </Link>
      </Card>
    );
  }

  // ── State #5: has a current therapist, no assessment booked yet
  // (this is the common state immediately after a Phase 14 switch).
  // Note: we don't have the therapist's name from current_therapist_id
  // alone — but we can synthesize "your current therapist" since the
  // /therapists page surfaces their identity directly.
  return (
    <Card className="mb-4 bg-brand-50/60 ring-1 ring-brand-100 animate-in fade-in slide-in-from-top-1 duration-300">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
        Up next
      </p>
      <h2 className="mt-1 text-base font-semibold text-slate-800">
        Book your assessment session
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Your first session with your current therapist is an assessment
        (&#x20A6;50,000). After that, you can purchase a 6-session block.
      </p>
      <Link
        href="/book"
        className="mt-3 inline-block rounded-xl bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white no-underline transition hover:bg-brand-700"
      >
        Go to booking →
      </Link>
    </Card>
  );
}

