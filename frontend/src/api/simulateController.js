import apiClient from "../services/apiClient";

const buildFallbackEvent = () => {
  const eventId = Math.floor(Math.random() * 9000) + 1000;
  const risk = Math.random() * 0.25 + 0.7;
  const timestamp = new Date().toISOString();

  return {
    status: "success",
    fraud_event: {
      event_id: eventId,
      timestamp,
      risk_score: Number(risk.toFixed(2)),
      message: "Simulated fraudulent commit detected (fallback)",
      activity: {
        commit_id: `sim-${eventId.toString(16)}`,
        author: "simulator",
        changes_detected: ["deploy.yml", "secrets.env"],
        flags: ["suspicious_file_change", "anomalous_runner_behavior"],
      },
      fallback: true,
    },
  };
};

const simulateController = {
  simulateFraud: async () => {
    try {
      // 1. Call the correct Backend URL
      const response = await apiClient.get("/api/simulate");

      // 2. Return the FULL response object 
      // (This fixes the "reading 'data' of undefined" error in your Dashboard)
      return response; 
      
    } catch (error) {
      return buildFallbackEvent();
    }
  },
};

export default simulateController;