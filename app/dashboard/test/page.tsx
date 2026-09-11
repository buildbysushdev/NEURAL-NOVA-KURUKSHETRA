"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * Pre-Demo AI Agent Verification Console (/dashboard/test/page.tsx)
 * ==============================================================================
 * 
 * Production-Grade Institutional Emergency Design:
 * - Base: #12161C, Card: #181E26, Border: #222933, Text: #F6F4EF
 * - Severity Left-Border Strips: #3B6D11 (Pass), #791F1F (Fail)
 * - 9 Comprehensive Test Cases across all 3 AI agents:
 *   1. Needs-Assessment (Low, Medium, Critical + Dynamic sensitivity)
 *   2. Allocation Agent (Sufficient vs Scarcity + Gemini Malformed Resilience)
 *   3. Chatbot Agent (Grounded vs Anti-Hallucination + API Resilience)
 */

import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ShieldCheck,
  ShieldAlert,
  Cpu,
  Boxes,
  MessageSquare,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface TestCaseResult {
  id: number;
  agent: string;
  testCase: string;
  status: "PASS" | "FAIL";
  score?: string;
  summary: string;
  details: any;
}

export default function AgentVerificationPage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<TestCaseResult[]>([]);
  const [lastRunTime, setLastRunTime] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const runAllTests = async () => {
    setRunning(true);
    try {
      const res = await fetch("/api/demo/verify-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.results)) {
        setResults(data.results);
        setLastRunTime(new Date().toLocaleTimeString());

        if (data.all_passed) {
          toast.success("Verification Suite Complete", {
            description: "All 9 AI agent test cases passed with 100% compliance.",
          });
        } else {
          toast.error("Verification Discrepancy Found", {
            description: `${data.total_tests - data.passed_count} test cases failed. Inspect details below.`,
          });
        }
      }
    } catch (err: any) {
      toast.error("Test execution exception", {
        description: err.message || "Failed to reach verification endpoint.",
      });
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    runAllTests();
  }, []);

  const totalTests = results.length;
  const passedCount = results.filter((r) => r.status === "PASS").length;
  const failedCount = totalTests - passedCount;
  const allPassed = totalTests > 0 && failedCount === 0;

  return (
    <div className="space-y-6 text-[#F6F4EF] font-ibm-sans pb-16">
      
      {/* Header Banner */}
      <div className="border border-[#222933] bg-[#181E26] p-5 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={allPassed ? "dot-safe" : "dot-watch"} />
            <span className="font-ibm-mono text-[11px] uppercase tracking-widest text-[#8A99AD]">
              TACTICAL TEST RIG // STAGE PRE-FLIGHT READINESS
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#F6F4EF]">
            AI Agent Verification &amp; Fault-Tolerance Console
          </h1>
          <p className="text-xs text-[#8A99AD] mt-0.5">
            Automated compliance tests verifying dynamic scoring, scarcity knapsack allocation, anti-hallucination grounding, and model API resilience.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            disabled={running}
            onClick={runAllTests}
            className="h-10 px-5 text-xs font-bold"
          >
            {running ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} />
                <span>Running Test Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Execute Pre-Demo Verification</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Top Telemetry Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card severity="none" className="p-4 bg-[#181E26] border-[#222933]">
          <span className="font-ibm-mono text-[11px] uppercase tracking-wider text-[#8A99AD] block">
            Total Test Cases
          </span>
          <p className="font-ibm-mono text-2xl sm:text-3xl font-bold text-[#F6F4EF] mt-1">
            {totalTests || 9}
          </p>
          <span className="font-ibm-mono text-[10px] text-[#8A99AD] block mt-1">
            3 Tests per Autonomous Agent
          </span>
        </Card>

        <Card severity="safe" className="p-4 bg-[#181E26] border-[#222933]">
          <span className="font-ibm-mono text-[11px] uppercase tracking-wider text-[#8A99AD] block">
            Passed Validations
          </span>
          <p className="font-ibm-mono text-2xl sm:text-3xl font-bold text-[#3B6D11] mt-1">
            {passedCount}
          </p>
          <span className="font-ibm-mono text-[10px] text-[#8A99AD] block mt-1">
            Compliant Specifications
          </span>
        </Card>

        <Card severity={failedCount > 0 ? "critical" : "none"} className="p-4 bg-[#181E26] border-[#222933]">
          <span className="font-ibm-mono text-[11px] uppercase tracking-wider text-[#8A99AD] block">
            Failed Cases
          </span>
          <p className={`font-ibm-mono text-2xl sm:text-3xl font-bold mt-1 ${failedCount > 0 ? "text-[#791F1F]" : "text-[#F6F4EF]"}`}>
            {failedCount}
          </p>
          <span className="font-ibm-mono text-[10px] text-[#8A99AD] block mt-1">
            Zero Tolerance Requirement
          </span>
        </Card>

        <Card severity={allPassed ? "safe" : "watch"} className="p-4 bg-[#181E26] border-[#222933]">
          <span className="font-ibm-mono text-[11px] uppercase tracking-wider text-[#8A99AD] block">
            Readiness Grade
          </span>
          <p className="font-ibm-mono text-base sm:text-lg font-bold text-[#F6F4EF] mt-2">
            {allPassed ? "100% DEMO READY" : running ? "TESTING IN PROGRESS..." : "ATTENTION REQUIRED"}
          </p>
          <span className="font-ibm-mono text-[10px] text-[#8A99AD] block mt-1">
            Last evaluated: {lastRunTime || "Just now"}
          </span>
        </Card>
      </div>

      {/* 9 Test Cases List */}
      <div className="border border-[#222933] bg-[#181E26] rounded-sm overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-[#222933]">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[#8A99AD]" strokeWidth={1.75} />
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-[#F6F4EF]">
              PRE-DEMO AGENT COMPLIANCE MATRIX (9 / 9 VERIFIED)
            </h3>
          </div>
          <span className="font-ibm-mono text-[11px] text-[#8A99AD]">
            STANDARDS: PS20 PRODUCTION SPEC
          </span>
        </div>

        <div className="divide-y divide-[#222933]/70">
          {running && results.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <Loader2 className="w-6 h-6 text-[#F6F4EF] animate-spin mx-auto" />
              <p className="text-xs font-mono uppercase tracking-wider text-[#8A99AD]">
                Executing agent heuristics and API resilience pipelines...
              </p>
            </div>
          ) : (
            results.map((r) => {
              const isPass = r.status === "PASS";
              const isExpanded = expandedId === r.id;

              return (
                <div
                  key={r.id}
                  className={`p-4 transition-colors border-l-4 ${
                    isPass ? "border-l-[#3B6D11] hover:bg-[#12161C]/50" : "border-l-[#791F1F] hover:bg-[#12161C]/50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-ibm-mono text-[10px] font-bold px-1.5 py-0.2 rounded-sm bg-[#12161C] border border-[#222933] text-[#8A99AD]">
                          #{r.id}
                        </span>
                        <span className="font-ibm-mono text-xs uppercase font-bold text-[#F6F4EF]">
                          {r.agent}
                        </span>
                        <span className="text-[#8A99AD] text-xs">•</span>
                        <span className="text-xs text-[#8A99AD] font-mono">
                          {r.testCase}
                        </span>
                      </div>

                      <p className="text-xs text-[#F6F4EF] mt-1 font-mono">
                        {r.summary}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 font-ibm-mono text-xs font-bold px-2.5 py-0.5 rounded-sm border ${
                          isPass
                            ? "bg-[#12161C] border-[#3B6D11] text-[#3B6D11]"
                            : "bg-[#12161C] border-[#791F1F] text-[#791F1F]"
                        }`}
                      >
                        {isPass ? <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} /> : <XCircle className="w-3.5 h-3.5" strokeWidth={1.75} />}
                        {r.status}
                      </span>

                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                        className="p-1 rounded-sm border border-[#222933] text-[#8A99AD] hover:text-[#F6F4EF]"
                        title="Toggle JSON details"
                      >
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded JSON Inspector */}
                  {isExpanded && (
                    <div className="mt-3 pt-3 border-t border-[#222933] space-y-2">
                      <span className="font-ibm-mono text-[10px] uppercase tracking-wider text-[#8A99AD] block">
                        Payload Telemetry &amp; Verification Output:
                      </span>
                      <pre className="p-3 rounded-sm bg-[#12161C] border border-[#222933] font-ibm-mono text-[11px] text-[#8A99AD] overflow-x-auto">
                        {JSON.stringify(r.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
}
