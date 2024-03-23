import "mocha";
import request from "supertest";
import { app } from "../../src/app.js";

describe("/*", () => {
  it("The server must answer with code 501 by default", async () => {
    await request(app).get("/test").expect(501);
  });
});
