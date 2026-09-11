/**
 * ==============================================================================
 * KURUKSHETRA PS20 - LOCALIZATION SYSTEM
 * File: lib/translations.ts (English & Hindi Translations)
 * ==============================================================================
 */

export type Language = "en" | "hi";

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const translations: TranslationDictionary = {
  // Brand & Navigation
  brand_title: {
    en: "Kurukshetra PS20",
    hi: "कुरुक्षेत्र PS20"
  },
  brand_subtitle: {
    en: "Agentic Disaster Relief Platform",
    hi: "एजेंटिक आपदा राहत मंच"
  },
  demo_switch: {
    en: "Demo Switch",
    hi: "डेमो स्विच"
  },
  logout: {
    en: "Logout",
    hi: "लॉगआउट"
  },
  login: {
    en: "Login",
    hi: "लॉग इन"
  },
  switch_role: {
    en: "Switch Responder Role",
    hi: "भूमिका बदलें"
  },

  // Roles
  role_citizen: {
    en: "Citizen Portal",
    hi: "नागरिक पोर्टल"
  },
  role_rescue: {
    en: "Rescue Team",
    hi: "बचाव दल"
  },
  role_authority: {
    en: "Authority Command",
    hi: "प्राधिकरण कमान"
  },

  // Citizen Dashboard & Reporting
  safety_status: {
    en: "Safety Status",
    hi: "सुरक्षा स्थिति"
  },
  status_safe: {
    en: "SAFE ZONE",
    hi: "सुरक्षित क्षेत्र"
  },
  status_danger: {
    en: "DANGER DETECTED",
    hi: "खतरा दर्ज"
  },
  report_incident: {
    en: "Report Incident",
    hi: "घटना की सूचना दें"
  },
  report_description: {
    en: "Submit geotagged emergency report to central response mesh.",
    hi: "केंद्रीय नियंत्रण कक्ष को जियोटैग की गई आपातकालीन रिपोर्ट भेजें।"
  },
  disaster_type: {
    en: "Disaster Hazard Type",
    hi: "आपदा का प्रकार"
  },
  select_disaster_type: {
    en: "Select disaster classification...",
    hi: "आपदा का प्रकार चुनें..."
  },
  incident_details: {
    en: "Incident Situation Details",
    hi: "घटना का विस्तृत विवरण"
  },
  incident_placeholder: {
    en: "Describe what happened, trapped victims, rising water level, road blockage...",
    hi: "घटना, फंसे हुए लोग, पानी का स्तर या मार्ग अवरोध का विवरण दें..."
  },
  gps_coordinates: {
    en: "Incident GPS Coordinates",
    hi: "घटना के GPS निर्देशांक"
  },
  fetch_gps: {
    en: "Fetch Current GPS",
    hi: "वर्तमान GPS प्राप्त करें"
  },
  voice_input: {
    en: "Voice Input (Speech-to-Text)",
    hi: "ध्वनि इनपुट (बोलकर लिखें)"
  },
  listening: {
    en: "Listening...",
    hi: "सुन रहा हूँ..."
  },
  submit_report: {
    en: "Transmit Emergency Report",
    hi: "आपातकालीन रिपोर्ट भेजें"
  },
  queued_offline: {
    en: "Device Offline • Queued for Sync",
    hi: "डिवाइस ऑफ़लाइन • सिंक के लिए कतारबद्ध"
  },
  live_alerts_map: {
    en: "Live Tactical Alerts Map",
    hi: "लाइव सामरिक चेतावनी मानचित्र"
  },

  // Rescue Dashboard & Tasks
  rescue_missions: {
    en: "Active Rescue Missions",
    hi: "सक्रिय बचाव अभियान"
  },
  accept_task: {
    en: "Accept Task",
    hi: "कार्य स्वीकार करें"
  },
  mark_complete: {
    en: "Mark Complete",
    hi: "पूर्ण चिह्नित करें"
  },
  request_help: {
    en: "Request Backup",
    hi: "मदद का अनुरोध करें"
  },
  navigate_maps: {
    en: "Navigate via Maps",
    hi: "मानचित्र पर नेविगेट करें"
  },
  mission_in_progress: {
    en: "Mission In Progress",
    hi: "अभियान जारी है"
  },
  mission_resolved: {
    en: "Mission Resolved",
    hi: "अभियान संपन्न"
  },
  required_resources: {
    en: "Required Resources",
    hi: "आवश्यक संसाधन"
  },

  // Authority Dashboard & Audit Log
  master_command: {
    en: "Master Command Center",
    hi: "मास्टर नियंत्रण केंद्र"
  },
  simulate_disaster: {
    en: "Simulate Disaster Wave",
    hi: "आपदा तरंग अनुकरण करें"
  },
  ai_decision_audit: {
    en: "AI Decision Audit Log",
    hi: "एआई निर्णय ऑडिट लॉग"
  },
  inventory_telemetry: {
    en: "Depot Resource Inventory",
    hi: "राहत संसाधन सूची"
  },
  low_stock_warning: {
    en: "Low Stock Alert",
    hi: "स्टॉक की कमी चेतावनी"
  },
  manual_override: {
    en: "Manual Override",
    hi: "मैन्युअल नियंत्रण"
  },
  approve_allocation: {
    en: "Approve AI Action",
    hi: "एआई कार्रवाई स्वीकृत करें"
  },
  reject_allocation: {
    en: "Reject AI Action",
    hi: "एआई कार्रवाई अस्वीकृत करें"
  },
  listen_aloud: {
    en: "Listen Aloud (TTS)",
    hi: "बोलकर सुनें (TTS)"
  },
  speech_browser_note: {
    en: "Note: Speech Recognition & Synthesis functions operate with highest reliability on Google Chrome.",
    hi: "सूचना: वाणी पहचान और वाचन (Speech API) Google Chrome ब्राउज़र पर सर्वोत्तम काम करती है।"
  }
};

/**
 * Translation helper function
 */
export function t(key: string, lang: Language = "en"): string {
  if (translations[key] && translations[key][lang]) {
    return translations[key][lang];
  }
  return key;
}
