import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 60000,
});

export async function planTrip(payload) {
  try {
    const { data } = await client.post("/api/plan-trip/", payload);
    return data;
  } catch (err) {
    const detail =
      err?.response?.data?.error ||
      err?.response?.data?.detail ||
      (err?.response?.data && typeof err.response.data === "object"
        ? Object.values(err.response.data).flat().join(" ")
        : null) ||
      err?.message ||
      "Something went wrong while planning the trip.";
    throw new Error(detail);
  }
}

export { API_URL };
