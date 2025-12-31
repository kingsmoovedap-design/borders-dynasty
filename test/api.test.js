const request = require("supertest");
const app = require("../index");

describe("Borders Dynasty API", () => {
  it("returns health status", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("creates a load when origin and destination are provided", async () => {
    const res = await request(app)
      .post("/loads")
      .send({ origin: "Los Angeles, CA", destination: "Phoenix, AZ" });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty("id");
    expect(res.body.status).toBe("CREATED");
  });

  it("returns 400 when origin or destination is missing", async () => {
    const res = await request(app)
      .post("/loads")
      .send({ origin: "Los Angeles, CA" });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});
