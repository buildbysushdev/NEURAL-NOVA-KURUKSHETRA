"use client";

/**
 * ==============================================================================
 * KURUKSHETRA PS20 - AGENTIC DISASTER RELIEF
 * RescueInventoryManager.tsx (Rescue Team Field Stock & HQ Inventory Sync)
 * ==============================================================================
 * 
 * Features:
 * 1. Field Rescuers can manage deployed & on-hand supplies (Boats, Life Jackets, Medical Kits, Fuel, Pumps).
 * 2. Instant two-way synchronization with Authority Portal (InventoryTable.tsx) via localStorage & storage events.
 * 3. Quick stock decrement ("Used on Mission") and increment ("Restocked from Depot").
 * 4. Critical depletion alert banner when gear falls below squad survival threshold.
 * 5. One-click "Request Immediate Air-Drop / Supply Convoy" to Authority command.
 */

import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Package,
  Plus,
  Minus,
  Ship,
  HeartPulse,
  Droplets,
  LifeBuoy,
  Zap,
  Radio,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Send,
  Fuel
} from "lucide-react";

export interface FieldResourceItem {
  id: string;
  name: string;
  category: "mobility" | "medical" | "life_support" | "hydration" | "energy" | "comms";
  unit: string;
  available_qty: number;
  total_capacity: number;
  allocated_qty: number;
  critical_threshold: number;
  location_hub?: string;
  squad_on_hand?: number; // In-field with Rescue Squad Alpha
}

const DEFAULT_FIELD_RESOURCES: FieldResourceItem[] = [
  {
    id: "res-05",
    name: "Inflatable Zodiac Motor Boats",
    category: "mobility",
    unit: "Boats",
    available_qty: 8,
    total_capacity: 24,
    allocated_qty: 16,
    critical_threshold: 5,
    squad_on_hand: 4,
    location_hub: "Marina Coastal Post"
  },
  {
    id: "res-pfd",
    name: "Type-III Life Jackets & Buoys",
    category: "life_support",
    unit: "Vests",
    available_qty: 45,
    total_capacity: 150,
    allocated_qty: 105,
    critical_threshold: 30,
    squad_on_hand: 28,
    location_hub: "Squad Alpha Mobile Unit"
  },
  {
    id: "res-04",
    name: "Level-3 Trauma & Extrication Kits",
    category: "medical",
    unit: "Kits",
    available_qty: 120,
    total_capacity: 300,
    allocated_qty: 180,
    critical_threshold: 50,
    squad_on_hand: 18,
    location_hub: "Central Metro Hospital Hub"
  },
  {
    id: "res-pump",
    name: "Submersible De-Watering Pumps",
    category: "mobility",
    unit: "Pumps",
    available_qty: 6,
    total_capacity: 16,
    allocated_qty: 10,
    critical_threshold: 4,
    squad_on_hand: 3,
    location_hub: "Saidapet Emergency Depot"
  },
  {
    id: "res-01",
    name: "Drinking Water (20L Cans)",
    category: "hydration",
    unit: "Cans",
    available_qty: 180,
    total_capacity: 2500,
    allocated_qty: 2320,
    critical_threshold: 400,
    squad_on_hand: 35,
    location_hub: "Marina Central Depot"
  },
  {
    id: "res-06",
    name: "Diesel Fuel Drums (200L)",
    category: "energy",
    unit: "Drums",
    available_qty: 15,
    total_capacity: 120,
    allocated_qty: 105,
    critical_threshold: 30,
    squad_on_hand: 4,
    location_hub: "Western Basin Depot"
  },
  {
    id: "res-radio",
    name: "Rugged Tactical VHF/UHF Handsets",
    category: "comms",
    unit: "Radios",
    available_qty: 18,
    total_capacity: 40,
    allocated_qty: 22,
    critical_threshold: 10,
    squad_on_hand: 12,
    location_hub: "SDRF Tactical Command"
  }
];

export function RescueInventoryManager() {
  const [resources, setResources] = useState<FieldResourceItem[]>(DEFAULT_FIELD_RESOURCES);
  const [filter, setFilter] = useState<string>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<string>("Just now");

  // Load shared inventory from localStorage
  const loadSharedInventory = () => {
    try {
      const stored = localStorage.getItem("disaster_relief_resources");
      if (stored) {
        const parsed = JSON.parse(stored);
        // Merge or update existing items
        setResources((prev) => {
          return prev.map((item) => {
            const match = parsed.find((p: any) => p.id === item.id);
            if (match) {
              return {
                ...item,
                available_qty: match.available_qty,
                total_capacity: match.total_capacity || item.total_capacity,
                allocated_qty: match.allocated_qty || item.allocated_qty,
              };
            }
            return item;
          });
        });
      } else {
        localStorage.setItem("disaster_relief_resources", JSON.stringify(DEFAULT_FIELD_RESOURCES));
      }
      setLastSyncTime(new Date().toLocaleTimeString());
    } catch (e) {
      console.warn("Error loading field inventory:", e);
    }
  };

  useEffect(() => {
    loadSharedInventory();
    window.addEventListener("storage", loadSharedInventory);
    return () => window.removeEventListener("storage", loadSharedInventory);
  }, []);

  // Update squad on-hand & sync back to shared Authority inventory
  const handleStockChange = (id: string, delta: number, field: "squad_on_hand" | "available_qty") => {
    setUpdatingId(id);
    setResources((prev) => {
      const updated = prev.map((item) => {
        if (item.id === id) {
          const currentVal = item[field] ?? 0;
          const newVal = Math.max(0, currentVal + delta);

          // If squad consumes items, deduct from on-hand and total available in depot
          const updatedItem = {
            ...item,
            [field]: newVal,
          };

          if (field === "squad_on_hand" && delta < 0) {
            // Also deduct from available_qty
            updatedItem.available_qty = Math.max(0, item.available_qty + delta);
          }

          return updatedItem;
        }
        return item;
      });

      // Write to localStorage for two-way sync with Authority Portal
      try {
        localStorage.setItem("disaster_relief_resources", JSON.stringify(updated));
        window.dispatchEvent(new Event("storage"));
      } catch (e) {}

      return updated;
    });

    setTimeout(() => setUpdatingId(null), 300);

    toast.info("Field Stock Updated", {
      description: `Count adjusted. Synchronized live with Authority Master Depot.`,
    });
  };

  const handleRequestResupply = (itemName: string) => {
    toast.success("Resupply Priority Request Dispatched", {
      description: `Emergency requisition for [${itemName}] sent to Authority Logistics Commander.`,
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "mobility":
        return <Ship className="w-4 h-4 text-cyan-400" />;
      case "life_support":
        return <LifeBuoy className="w-4 h-4 text-amber-400" />;
      case "medical":
        return <HeartPulse className="w-4 h-4 text-rose-400" />;
      case "hydration":
        return <Droplets className="w-4 h-4 text-blue-400" />;
      case "energy":
        return <Fuel className="w-4 h-4 text-yellow-400" />;
      case "comms":
        return <Radio className="w-4 h-4 text-emerald-400" />;
      default:
        return <Package className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredItems = resources.filter((item) => {
    if (filter === "all") return true;
    if (filter === "low") return (item.squad_on_hand ?? item.available_qty) <= item.critical_threshold;
    return item.category === filter;
  });

  return (
    <div className="space-y-4 font-ibm-sans">
      
      {/* Header bar with two-way sync status */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#111827]/80 p-4 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
                Squad Alpha Field Inventory &amp; Logistics
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                TWO-WAY HQ SYNC ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Updates here immediately reflect inside the Authority Portal Logistics Desk.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadSharedInventory}
            className="px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-mono text-slate-300 flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Synced: {lastSyncTime}</span>
          </button>
        </div>
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { id: "all", label: "All Gear" },
          { id: "mobility", label: "Boats & Rescue Craft" },
          { id: "life_support", label: "Life Support & Vests" },
          { id: "medical", label: "Medical & Trauma" },
          { id: "energy", label: "Fuel & Power" },
          { id: "comms", label: "Tactical Radios" },
          { id: "low", label: "⚠️ Depleted Stock" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition ${
              filter === tab.id
                ? "bg-amber-500/20 border border-amber-500/40 text-amber-300 font-semibold"
                : "bg-white/[0.02] border border-white/[0.06] text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Resource cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredItems.map((item) => {
          const onHand = item.squad_on_hand ?? item.available_qty;
          const isCritical = onHand <= item.critical_threshold;
          const percent = Math.min(100, Math.round((onHand / item.total_capacity) * 100));

          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 backdrop-blur-md transition-all ${
                isCritical
                  ? "border-red-500/40 bg-red-950/20 shadow-lg shadow-red-950/30"
                  : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.12]"
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    {getCategoryIcon(item.category)}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">{item.name}</h4>
                    <span className="text-[10px] font-mono text-slate-500">
                      Hub: {item.location_hub || "Central Depot"}
                    </span>
                  </div>
                </div>

                {isCritical && (
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 text-[9px] font-mono font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> LOW
                  </span>
                )}
              </div>

              {/* Progress bar */}
              <div className="space-y-1 mb-4">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Squad On-Hand</span>
                  <span className={isCritical ? "text-red-400 font-bold" : "text-slate-200 font-bold"}>
                    {onHand} {item.unit} / {item.total_capacity} cap
                  </span>
                </div>
                <div className="h-1.5 w-full bg-white/[0.06] rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      isCritical ? "bg-red-500" : percent < 40 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.max(6, percent)}%` }}
                  />
                </div>
              </div>

              {/* Action buttons: - / + and request restock */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/[0.06]">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleStockChange(item.id, -1, "squad_on_hand")}
                    disabled={onHand <= 0 || updatingId === item.id}
                    title="Deploy / Use 1 Item"
                    className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 flex items-center justify-center text-xs transition active:scale-95 disabled:opacity-40"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center font-mono text-xs font-bold text-slate-200">
                    {onHand}
                  </span>
                  <button
                    onClick={() => handleStockChange(item.id, 1, "squad_on_hand")}
                    disabled={updatingId === item.id}
                    title="Restock / Add 1 Item"
                    className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 flex items-center justify-center text-xs transition active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <button
                  onClick={() => handleRequestResupply(item.name)}
                  className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-[10px] font-mono font-medium flex items-center gap-1 transition"
                >
                  <Send className="w-3 h-3" />
                  <span>Request Resupply</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
