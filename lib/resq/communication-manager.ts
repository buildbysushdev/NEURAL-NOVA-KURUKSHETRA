/**
 * ==============================================================================
 * RESQNET: CommunicationManager & Transport Adapters
 * ==============================================================================
 * 
 * CORE HONESTY DISCLOSURE:
 * 1. Ordinary smartphones contain Cellular, Wi-Fi, and Bluetooth radios.
 * 2. They do NOT contain LoRa hardware radios. LoRa is modeled as an External
 *    LoRa Gateway (868/915 MHz transceiver base node or vehicle-mounted node).
 * 3. Ordinary smartphones do NOT connect directly to Satellites without
 *    dedicated satellite transceivers (e.g. Iridium Edge). Satellite is modeled
 *    as a Simulated / Optional External Gateway Transport.
 */

import { CommTransportType, EmergencyPacket, NetworkHealth, TransportState } from "./types";

export interface CommRouteResolution {
  transport: CommTransportType | "STORED_LOCALLY";
  status: "DELIVERED" | "STORED_LOCALLY" | "FORWARDED_LORA" | "DELIVERED_SAT";
  status_text: string;
  path_diagram: string[];
  delivered: boolean;
  packet_id: string;
}

export class CommunicationManager {
  private cellularOnline: boolean = true;
  private internetOnline: boolean = true;
  private p2pMeshAvailable: boolean = true;
  private loraGatewayOnline: boolean = false;
  private storeForwardActive: boolean = true;
  private satelliteSimulated: boolean = false;

  private localBuffer: EmergencyPacket[] = [];

  constructor() {
    this.resetNetworkState();
  }

  public resetNetworkState(): void {
    this.cellularOnline = true;
    this.internetOnline = true;
    this.p2pMeshAvailable = true;
    this.loraGatewayOnline = false;
    this.storeForwardActive = true;
    this.satelliteSimulated = false;
    this.localBuffer = [];
  }

  // Presenter Controls
  public setCellular(online: boolean): void {
    this.cellularOnline = online;
  }

  public setInternet(online: boolean): void {
    this.internetOnline = online;
  }

  public setP2P(available: boolean): void {
    this.p2pMeshAvailable = available;
  }

  public setLoRaGateway(online: boolean): void {
    this.loraGatewayOnline = online;
  }

  public setSatelliteSimulated(active: boolean): void {
    this.satelliteSimulated = active;
  }

  public getNetworkHealth(): NetworkHealth {
    let activeTransport: CommTransportType | "NONE" = "NONE";
    if (this.cellularOnline && this.internetOnline) {
      activeTransport = "CELLULAR";
    } else if (this.p2pMeshAvailable) {
      activeTransport = "P2P_MESH";
    } else if (this.loraGatewayOnline) {
      activeTransport = "LORA";
    } else if (this.satelliteSimulated) {
      activeTransport = "SATELLITE";
    }

    return {
      cellular: this.cellularOnline,
      internet: this.internetOnline,
      p2p_mesh: this.p2pMeshAvailable,
      lora_gateway: this.loraGatewayOnline,
      store_forward_active: this.storeForwardActive,
      satellite_simulated: this.satelliteSimulated,
      active_transport: activeTransport,
      pending_packets_count: this.localBuffer.length,
      buffered_packets: [...this.localBuffer],
    };
  }

  public getTransportStates(): TransportState[] {
    return [
      {
        type: "CELLULAR",
        label: "Cellular / 4G / 5G",
        is_available: this.cellularOnline && this.internetOnline,
        is_external_hardware: false,
        hardware_disclosure: "Standard smartphone modem (dependent on cell towers).",
        bandwidth: "High (50+ Mbps)",
        typical_range: "Cellular Tower coverage (~5 km)",
        active_route_count: this.cellularOnline ? 1 : 0,
        status_text: this.cellularOnline ? "ONLINE" : "OFFLINE",
      },
      {
        type: "P2P_MESH",
        label: "Wi-Fi / BLE Peer Mesh",
        is_available: this.p2pMeshAvailable,
        is_external_hardware: false,
        hardware_disclosure: "Standard smartphone Bluetooth 5.0 / Wi-Fi Direct peer hopping.",
        bandwidth: "Medium (1–2 Mbps)",
        typical_range: "Peer-to-peer (15–100 meters per hop)",
        active_route_count: this.p2pMeshAvailable ? 3 : 0,
        status_text: this.p2pMeshAvailable ? "ONLINE" : "OFFLINE",
      },
      {
        type: "LORA",
        label: "External LoRa Emergency Gateway",
        is_available: this.loraGatewayOnline,
        is_external_hardware: true,
        hardware_disclosure: "Requires external LoRa base station / vehicle node (868/915 MHz). Not in phone.",
        bandwidth: "Ultra-Low (0.3 – 5.5 kbps)",
        typical_range: "2 – 15 km long range line-of-sight",
        active_route_count: this.loraGatewayOnline ? 1 : 0,
        status_text: this.loraGatewayOnline ? "ONLINE" : "OFFLINE",
      },
      {
        type: "STORE_FORWARD",
        label: "Store & Forward Buffer",
        is_available: this.storeForwardActive,
        is_external_hardware: false,
        hardware_disclosure: "Device LocalStorage / IndexedDB non-volatile offline queue.",
        bandwidth: "Zero over-the-air (local storage)",
        typical_range: "On-device until node discovery",
        active_route_count: this.localBuffer.length,
        status_text: "ACTIVE_BUFFER",
      },
      {
        type: "SATELLITE",
        label: "Satellite Gateway Adapter (Simulated)",
        is_available: this.satelliteSimulated,
        is_external_hardware: true,
        hardware_disclosure: "Requires dedicated external satellite transceiver hardware (e.g. Iridium Edge).",
        bandwidth: "Low (2.4 kbps burst)",
        typical_range: "Global LEO/GEO satellite link",
        active_route_count: this.satelliteSimulated ? 1 : 0,
        status_text: this.satelliteSimulated ? "AVAILABLE_SIMULATED" : "OFFLINE",
      },
    ];
  }

  /**
   * Evaluates transmission route for an incoming emergency packet.
   * Follows the strict fallback hierarchy:
   * 1. Cellular + Internet
   * 2. P2P Mesh
   * 3. Store & Forward buffer (if totally severed)
   * 4. Flush buffer when LoRa or Satellite becomes available
   */
  public transmitPacket(packet: EmergencyPacket): CommRouteResolution {
    // 1. Cellular Route (Step 3)
    if (this.cellularOnline && this.internetOnline) {
      return {
        transport: "CELLULAR",
        status: "DELIVERED",
        status_text: "Message delivered successfully via Cellular / Internet.",
        path_diagram: ["CITIZEN", "CELLULAR", "INTERNET", "RESCUE COMMAND"],
        delivered: true,
        packet_id: packet.packet_id,
      };
    }

    // 2. Wi-Fi / BLE P2P Mesh (Step 4)
    if (this.p2pMeshAvailable) {
      return {
        transport: "P2P_MESH",
        status: "DELIVERED",
        status_text: "Cellular offline. Forwarded via nearby P2P / Mesh peer hop.",
        path_diagram: ["CITIZEN", "P2P / MESH", "RESCUE NODE", "COMMAND CENTER"],
        delivered: true,
        packet_id: packet.packet_id,
      };
    }

    // 3. LoRa Gateway (Step 6)
    if (this.loraGatewayOnline) {
      // Remove from local buffer if present
      this.localBuffer = this.localBuffer.filter((p) => p.packet_id !== packet.packet_id);
      return {
        transport: "LORA",
        status: "FORWARDED_LORA",
        status_text: "Transmitted via External LoRa Gateway (868 MHz). Delivered.",
        path_diagram: [
          "Citizen Device",
          "Local Emergency Packet",
          "External LoRa Gateway",
          "Rescue Command Center",
        ],
        delivered: true,
        packet_id: packet.packet_id,
      };
    }

    // 4. Satellite Adapter (Step 15)
    if (this.satelliteSimulated) {
      this.localBuffer = this.localBuffer.filter((p) => p.packet_id !== packet.packet_id);
      return {
        transport: "SATELLITE",
        status: "DELIVERED_SAT",
        status_text: "Transmitted via External Satellite Adapter. Delivered.",
        path_diagram: [
          "Citizen / Emergency Node",
          "Satellite Gateway",
          "Satellite Transport",
          "Rescue Command",
        ],
        delivered: true,
        packet_id: packet.packet_id,
      };
    }

    // 5. Total Network Blackout -> Store & Forward (Step 5)
    const exists = this.localBuffer.some((p) => p.packet_id === packet.packet_id);
    if (!exists) {
      this.localBuffer.push(packet);
    }

    return {
      transport: "STORE_FORWARD",
      status: "STORED_LOCALLY",
      status_text: "NO DIRECT CONNECTION. Message stored locally — waiting for relay.",
      path_diagram: [
        "Citizen Device",
        `Local Storage Queue (Packet: ${packet.packet_id})`,
        "Waiting for Relay / LoRa Node",
      ],
      delivered: false,
      packet_id: packet.packet_id,
    };
  }

  /**
   * Flushes stored packets when a transport (e.g. LoRa) becomes available.
   */
  public flushBufferedPackets(): { flushed: EmergencyPacket[]; count: number } {
    if (this.localBuffer.length === 0) return { flushed: [], count: 0 };

    const toFlush = [...this.localBuffer];
    this.localBuffer = [];
    return { flushed: toFlush, count: toFlush.length };
  }
}
