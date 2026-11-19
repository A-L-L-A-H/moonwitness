"use client";

import { useEffect, useState, type FormEvent } from "react";
import { requestApiJson } from "@moonwitness/contracts/sdk";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CutoutArtwork,
  Input,
  SkinOrnament,
} from "@moonwitness/ui";
import { AutoModelConsole } from "@/components/meta/auto-model-console";
import { ConsoleShellAdapter } from "@/components/shell/console-shell-adapter";
import { useTranslation } from "@/hocs/TranslationWrapper";

interface AccountSummaryPayload {
  data?: {
    totalAccounts?: number;
    totalMoves?: number;
    postedMoves?: number;
    draftMoves?: number;
    totalDebits?: number;
    totalCredits?: number;
    balanced?: boolean;
  };
}

export function InvoiceLedgerView() {
  const { dictionary } = useTranslation();
  const [search, setSearch] = useState("");
  const [activeModel, setActiveModel] = useState<
    "account.move" | "account.move.line" | "account.account"
  >("account.move");
  const [summary, setSummary] = useState<AccountSummaryPayload["data"] | null>(null);
  const [moveRef, setMoveRef] = useState("INV-2026-001");
  const [debitAccount, setDebitAccount] = useState("1100");
  const [creditAccount, setCreditAccount] = useState("4000");
  const [amount, setAmount] = useState("2500");
  const [reverseMoveId, setReverseMoveId] = useState("");
  const [ledgerNotice, setLedgerNotice] = useState<string | null>(null);

  async function loadSummary() {
    const res = await requestApiJson<AccountSummaryPayload>("/api/v1/account/summary").catch(
      () => null,
    );
    if (res?.data) setSummary(res.data);
  }

  useEffect(() => {
    void loadSummary();
  }, []);

  async function handlePostEntry(e: FormEvent) {
    e.preventDefault();
    setLedgerNotice(null);
    const numericAmount = Number(amount) || 0;
    try {
      await requestApiJson("/api/v1/account/ledger/post", {
        method: "POST",
        body: JSON.stringify({
          reference: moveRef.trim(),
          journal_code: "GEN",
          lines: [
            { account_code: debitAccount.trim(), debit: numericAmount, credit: 0 },
            { account_code: creditAccount.trim(), debit: 0, credit: numericAmount },
          ],
        }),
      });
      setLedgerNotice(`Posted balanced journal move ${moveRef} (${numericAmount}).`);
      await loadSummary();
    } catch (err) {
      setLedgerNotice(err instanceof Error ? err.message : "Failed to post journal entry.");
    }
  }

  async function handleReverseEntry(e: FormEvent) {
    e.preventDefault();
    if (!reverseMoveId.trim()) return;
    setLedgerNotice(null);
    try {
      await requestApiJson("/api/v1/account/ledger/reverse", {
        method: "POST",
        body: JSON.stringify({
          move_id: reverseMoveId.trim(),
          reason: "Operator reversal via Accounting Console",
        }),
      });
      setLedgerNotice(`Reversed journal move ${reverseMoveId.trim()}.`);
      setReverseMoveId("");
      await loadSummary();
    } catch (err) {
      setLedgerNotice(err instanceof Error ? err.message : "Failed to reverse journal move.");
    }
  }

  return (
    <ConsoleShellAdapter
      breadcrumb={dictionary.navigation.invoice}
      plane="creator"
      activeOverride="invoice"
      search={{
        value: search,
        onChange: setSearch,
        placeholder: dictionary.shell.searchPlaceholder,
      }}
    >
      <div className="space-y-4">
        <Card className="relative overflow-hidden">
          <SkinOrnament slot="corner" className="left-2 top-2" />
          <CutoutArtwork
            id="codex-scroll"
            decorative
            className="pointer-events-none absolute -right-4 -top-2 hidden h-24 w-24 opacity-20 sm:block"
          />
          <CardHeader>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">DOUBLE-ENTRY LEDGER</Badge>
              <Badge variant={summary?.balanced !== false ? "default" : "destructive"}>
                {summary?.balanced !== false ? "LEDGER BALANCED" : "IMBALANCE DETECTED"}
              </Badge>
            </div>
            <CardTitle className="text-lg uppercase">{dictionary.apps.invoiceTitle}</CardTitle>
            <CardDescription>{dictionary.apps.invoiceSubtitle}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="border border-[var(--border)] bg-[var(--background)] p-3">
                <div className="font-mono text-[10px] text-[var(--muted-foreground)]">ACCOUNTS</div>
                <div className="mt-1 font-brush text-2xl">{summary?.totalAccounts ?? 0}</div>
              </div>
              <div className="border border-[var(--border)] bg-[var(--background)] p-3">
                <div className="font-mono text-[10px] text-[var(--muted-foreground)]">POSTED MOVES</div>
                <div className="mt-1 font-brush text-2xl">{summary?.postedMoves ?? 0}</div>
              </div>
              <div className="border border-[var(--border)] bg-[var(--background)] p-3">
                <div className="font-mono text-[10px] text-[var(--muted-foreground)]">TOTAL DEBITS</div>
                <div className="mt-1 font-brush text-2xl">
                  {(summary?.totalDebits ?? 0).toLocaleString()}
                </div>
              </div>
              <div className="border border-[var(--border)] bg-[var(--background)] p-3">
                <div className="font-mono text-[10px] text-[var(--muted-foreground)]">TOTAL CREDITS</div>
                <div className="mt-1 font-brush text-2xl">
                  {(summary?.totalCredits ?? 0).toLocaleString()}
                </div>
              </div>
            </div>

            <form
              onSubmit={(e) => void handlePostEntry(e)}
              className="grid grid-cols-1 gap-2 border border-[var(--border)] bg-[var(--background)] p-3 sm:grid-cols-5"
            >
              <Input
                value={moveRef}
                onChange={(e) => setMoveRef(e.target.value)}
                placeholder="Reference"
                aria-label="Journal Reference"
              />
              <Input
                value={debitAccount}
                onChange={(e) => setDebitAccount(e.target.value)}
                placeholder="Debit Account"
                aria-label="Debit Account"
              />
              <Input
                value={creditAccount}
                onChange={(e) => setCreditAccount(e.target.value)}
                placeholder="Credit Account"
                aria-label="Credit Account"
              />
              <Input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount"
                aria-label="Journal Amount"
              />
              <Button type="submit" size="sm">
                Post Balanced Entry
              </Button>
            </form>

            <form
              onSubmit={(e) => void handleReverseEntry(e)}
              className="flex flex-wrap items-center gap-2 border border-[var(--border)] bg-[var(--background)] p-3"
            >
              <Input
                value={reverseMoveId}
                onChange={(e) => setReverseMoveId(e.target.value)}
                placeholder="Move ID to reverse…"
                aria-label="Move ID to reverse"
                className="max-w-xs"
              />
              <Button type="submit" size="sm" variant="outline" disabled={!reverseMoveId.trim()}>
                Reverse Posted Move
              </Button>
            </form>
            {ledgerNotice ? (
              <div className="font-mono text-xs text-[var(--primary)]">{ledgerNotice}</div>
            ) : null}
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: "account.move", label: "Journal Entries (account.move)" },
              { id: "account.move.line", label: "Journal Lines (account.move.line)" },
              { id: "account.account", label: "Chart of Accounts (account.account)" },
            ] as const
          ).map((m) => (
            <Button
              key={m.id}
              type="button"
              size="sm"
              variant={activeModel === m.id ? "default" : "outline"}
              onClick={() => setActiveModel(m.id)}
            >
              {m.label}
            </Button>
          ))}
        </div>

        <AutoModelConsole
          model={activeModel}
          searchQuery={search}
          domainIcon="account"
          cutoutId="codex-scroll"
        />
      </div>
    </ConsoleShellAdapter>
  );
}
export default InvoiceLedgerView;
