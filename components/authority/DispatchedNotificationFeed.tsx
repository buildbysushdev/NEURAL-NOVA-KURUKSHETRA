"use client";

import React, { useState, useEffect } from "react";
import { Smartphone, MessageSquare, PhoneCall, Radio, RefreshCw, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export interface DispatchedAlert {
  id: string;
  channel: "app" | "sms" | "call";
  recipientSector: string;
  severity: "critical" | "watch" | "safe";
  message: string;
  timestamp: string;
  status: "delivered" | "in-transit" | "failed";
}

interface DispatchedNotificationFeedProps {
  notifications?: DispatchedAlert[];
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export function DispatchedNotificationFeed({
  notifications: initialNotifications,
  isLoading = false,
  error = null,
  onRetry,
}: DispatchedNotificationFeedProps) {
  const [alerts, setAlerts] = useState<DispatchedAlert[]>(
    initialNotifications || [
      {
        id: "ntf-901",
        channel: "call",
        recipientSector: "Marina Coastal Ward 4",
        severity: "critical",
        message: "Automated IVR Siren: Immediate evacuation mandated for zone 4.",
        timestamp: "12:02:15 UTC",
        status: "delivered",
      },
      {
        id: "ntf-902",
        channel: "sms",
        recipientSector: "Guindy Industrial District",
        severity: "critical",
        message: "SMS Alert: Gas leakage detected in plant sub-station. Shelter in place.",
        timestamp: "11:58:40 UTC",
        status: "delivered",
      },
      {
        id: "ntf-903",
        channel: "app",
        recipientSector: "Royapettah Medical Zone",
        severity: "watch",
        message: "Push: Oxygen supply convoy dispatched from Central Hub Alpha.",
        timestamp: "11:51:10 UTC",
        status: "delivered",
      },
      {
        id: "ntf-904",
        channel: "sms",
        recipientSector: "Velachery North Sub-division",
        severity: "safe",
        message: "SMS Broadcast: Flood gate level stabilized. Water pumping active.",
        timestamp: "11:42:05 UTC",
        status: "delivered",
      },
    ]
  );

  useEffect(() => {
    if (initialNotifications && initialNotifications.length > 0) {
      setAlerts(initialNotifications);
    }
  }, [initialNotifications]);

  const renderChannelIcon = (channel: DispatchedAlert["channel"]) => {
    switch (channel) {
      case "sms":
        return <MessageSquare className="w-3.5 h-3.5 text-[#8A99AD]" strokeWidth={1.75} />;
      case "call":
        return <PhoneCall className="w-3.5 h-3.5 text-[#8A99AD]" strokeWidth={1.75} />;
      case "app":
      default:
        return <Smartphone className="w-3.5 h-3.5 text-[#8A99AD]" strokeWidth={1.75} />;
    }
  };

  const getSeverityDot = (sev: DispatchedAlert["severity"]) => {
    if (sev === "critical") return <span className="dot-critical" />;
    if (sev === "watch") return <span className="dot-watch" />;
    return <span className="dot-safe" />;
  };

  if (isLoading) {
    return (
      <div className="border border-[#222933] bg-[#181E26] rounded-sm p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-[#222933]">
          <Skeleton className="h-4 w-36 bg-[#222933]" />
          <Skeleton className="h-4 w-12 bg-[#222933]" />
        </div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-[#222933]/50">
            <div className="space-y-1.5 flex-1 pr-4">
              <Skeleton className="h-3 w-48 bg-[#222933]" />
              <Skeleton className="h-2.5 w-full bg-[#222933]/60" />
            </div>
            <Skeleton className="h-3 w-16 bg-[#222933]" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-[#222933] border-l-4 border-l-[#791F1F] bg-[#181E26] rounded-sm p-4 text-center">
        <AlertCircle className="w-5 h-5 text-[#791F1F] mx-auto mb-2" strokeWidth={1.75} />
        <p className="text-xs text-[#F6F4EF] font-semibold mb-1">Failed to Synchronize Telemetry Feed</p>
        <p className="text-xs text-[#8A99AD] mb-3">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs uppercase font-semibold border border-[#222933] text-[#F6F4EF] hover:bg-[#222933] rounded-sm"
          >
            <RefreshCw className="w-3 h-3" />
            Retry Connection
          </button>
        )}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="border border-[#222933] bg-[#181E26] rounded-sm p-6 text-center">
        <Radio className="w-6 h-6 text-[#8A99AD] mx-auto mb-2 opacity-50" strokeWidth={1.75} />
        <p className="text-xs font-semibold text-[#F6F4EF] uppercase tracking-wider">No Dispatched Alerts Yet</p>
        <p className="text-xs text-[#8A99AD] mt-1">Autonomous multi-channel notification stream will render dispatches in real-time.</p>
      </div>
    );
  }

  return (
    <div className="border border-[#222933] bg-[#181E26] rounded-sm flex flex-col">
      <div className="flex items-center justify-between p-3.5 border-b border-[#222933]">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#8A99AD]" strokeWidth={1.75} />
          <h4 className="text-xs font-semibold uppercase tracking-wider font-mono text-[#F6F4EF]">
            DISPATCHED BROADCAST FEED
          </h4>
        </div>
        <span className="font-ibm-mono text-[11px] text-[#8A99AD]">
          {alerts.length} LOGGED
        </span>
      </div>

      <div className="divide-y divide-[#222933]/60 overflow-y-auto max-h-72">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="p-3 hover:bg-[#12161C]/50 transition-colors flex items-start justify-between gap-3 text-xs"
          >
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 w-6 h-6 rounded-sm bg-[#12161C] border border-[#222933] flex items-center justify-center flex-shrink-0">
                {renderChannelIcon(alert.channel)}
              </div>
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  {getSeverityDot(alert.severity)}
                  <span className="font-semibold text-[#F6F4EF]">
                    {alert.recipientSector}
                  </span>
                  <span className="font-ibm-mono text-[10px] text-[#8A99AD] uppercase px-1 rounded-sm bg-[#12161C] border border-[#222933]">
                    {alert.channel}
                  </span>
                </div>
                <p className="text-xs text-[#8A99AD] leading-relaxed">
                  {alert.message}
                </p>
              </div>
            </div>

            <div className="text-right flex-shrink-0">
              <span className="font-ibm-mono text-[10px] text-[#8A99AD] block">
                {alert.timestamp}
              </span>
              <span className="font-ibm-mono text-[9px] uppercase tracking-wider text-[#3B6D11] block mt-0.5">
                {alert.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
