const axios = require("axios");

const ECCLESIA_PUBLIC_URL = process.env.ECCLESIA_URL || "https://codex-ecclesia-public.com";
const DYNASTY_ID = "DYNASTY-BORDERS-001";

class EcclesiaClient {
  constructor(baseUrl = ECCLESIA_PUBLIC_URL) {
    this.baseUrl = baseUrl;
    this.dynastyId = DYNASTY_ID;
  }

  async postNotice(type, data) {
    try {
      const notice = {
        dynastyId: this.dynastyId,
        type,
        data,
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(`${this.baseUrl}/api/notices`, notice, {
        timeout: 5000,
        headers: { "Content-Type": "application/json" }
      });

      console.log("[ECCLESIA] Notice posted:", { type, id: response.data?.id });
      return response.data;
    } catch (err) {
      console.error("[ECCLESIA] Failed to post notice:", err.message);
      return null;
    }
  }

  async getNotices(limit = 10) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/notices`, {
        params: { dynastyId: this.dynastyId, limit },
        timeout: 5000
      });
      return response.data;
    } catch (err) {
      console.error("[ECCLESIA] Failed to get notices:", err.message);
      return [];
    }
  }

  async postAnchor(rootHash, recordCount) {
    try {
      const anchor = {
        dynastyId: this.dynastyId,
        rootHash,
        recordCount,
        timestamp: new Date().toISOString(),
        chain: "SEPOLIA",
        contract: "0x12efC9a5D115AE7833c9a6D79f1B3BA18Cde817c"
      };

      const response = await axios.post(`${this.baseUrl}/api/anchors`, anchor, {
        timeout: 5000,
        headers: { "Content-Type": "application/json" }
      });

      console.log("[ECCLESIA] Anchor posted:", { rootHash: rootHash.substring(0, 16) });
      return response.data;
    } catch (err) {
      console.error("[ECCLESIA] Failed to post anchor:", err.message);
      return null;
    }
  }

  async verifyCertificate(certificateId) {
    try {
      const response = await axios.get(`${this.baseUrl}/api/certificates/${certificateId}`, {
        timeout: 5000
      });
      return response.data;
    } catch (err) {
      console.error("[ECCLESIA] Certificate verification failed:", err.message);
      return null;
    }
  }
}

module.exports = { EcclesiaClient, ECCLESIA_PUBLIC_URL, DYNASTY_ID };
