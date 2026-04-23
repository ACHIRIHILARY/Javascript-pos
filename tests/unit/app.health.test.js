import { describe, expect, it } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";

describe("health endpoint", () => {
  it("returns API health response", async () => {
    const app = createApp();
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: { status: "ok" },
    });
  });
});
