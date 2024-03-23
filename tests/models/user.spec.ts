import request from "supertest";
import { app } from "../../src/app.js";
import { User } from "../../src/models/user.js";

beforeEach(async () => {
  await User.deleteMany();
});

describe("Modelo User", () => {
  it("Must get an error because the email is required", async () => {
    await request(app)
      .post("/users")
      .send({
        name: "Test User",
        phone_number: "123456789",
        password: "Testuser123",
      })
      .expect(500);
  });

  it("Must get an error beacuse the email format is wrong", async () => {
    await request(app)
      .post("/users")
      .send({
        email: "testuser",
        name: "Test User",
        phone_number: "123456789",
        password: "Testuser123",
      })
      .expect(500);

    await request(app)
      .post("/users")
      .send({
        email: "testuser@.com",
        name: "Test User",
        phone_number: "123456789",
        password: "Testuser123",
      })
      .expect(500);

    await request(app)
      .post("/users")
      .send({
        email: "@gmail.com",
        name: "Test User",
        phone_number: "123456789",
        password: "Testuser123",
      })
      .expect(500);
  });

  it("Must get an error because the name is required", async () => {
    await request(app)
      .post("/users")
      .send({
        email: "testuser@gmail.com",
        phone_number: "123456789",
        password: "Testuser123",
      })
      .expect(500);
  });

  it("Must get an error because the password is required", async () => {
    await request(app)
      .post("/users")
      .send({
        email: "testuser@gmail.com",
        name: "Test User",
        phone_number: "123456789",
      })
      .expect(500);
  });

  it("Must get an error because the password format is wrong", async () => {
    await request(app)
      .post("/users")
      .send({
        email: "testuser@gmail.com",
        name: "Test User",
        phone_number: "123456789",
        password: "123",
      })
      .expect(500);

    await request(app)
      .post("/users")
      .send({
        email: "testuser@gmail.com",
        name: "Test User",
        phone_number: "123456789",
        password: "testuser",
      })
      .expect(500);

    await request(app)
      .post("/users")
      .send({
        email: "testuser@gmail.com",
        name: "Test User",
        phone_number: "123456789",
        password: "testuser123",
      })
      .expect(500);
  });
});
