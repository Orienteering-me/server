import request from "supertest";
import { app } from "../../src/app.js";
import { User } from "../../src/models/user.js";

describe("User Model", () => {
  beforeEach(async () => {
    await User.deleteMany();
  });

  it("Must get an error because the email is required", async () => {
    await request(app)
      .post("/users")
      .send({
        name: "Test User",
        phone_number: "123456789",
        password:
          "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
      })
      .expect(500);
  });

  it("Must get an error because the email format is wrong", async () => {
    await request(app)
      .post("/users")
      .send({
        email: "testuser",
        name: "Test User",
        phone_number: "123456789",
        password:
          "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
      })
      .expect(500);

    await request(app)
      .post("/users")
      .send({
        email: "testuser@.com",
        name: "Test User",
        phone_number: "123456789",
        password:
          "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
      })
      .expect(500);

    await request(app)
      .post("/users")
      .send({
        email: "@gmail.com",
        name: "Test User",
        phone_number: "123456789",
        password:
          "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
      })
      .expect(500);
  });

  it("Must get an error because the name is required", async () => {
    await request(app)
      .post("/users")
      .send({
        email: "usermodeltest@gmail.com",
        phone_number: "123456789",
        password:
          "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
      })
      .expect(500);
  });

  it("Must get an error because the phone number format is wrong", async () => {
    await request(app)
      .post("/users")
      .send({
        email: "usermodeltest@gmail.com",
        name: "Test User",
        phone_number: "123",
        password:
          "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
      })
      .expect(500);

    await request(app)
      .post("/users")
      .send({
        email: "usermodeltest@gmail.com",
        name: "Test User",
        phone_number: "0",
        password:
          "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
      })
      .expect(500);

    await request(app)
      .post("/users")
      .send({
        email: "usermodeltest@gmail.com",
        name: "Test User",
        phone_number: "Hola",
        password:
          "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
      })
      .expect(500);
  });

  it("Must get an error because the password is required", async () => {
    await request(app)
      .post("/users")
      .send({
        email: "usermodeltest@gmail.com",
        name: "Test User",
        phone_number: "123456789",
      })
      .expect(500);
  });

  it("Must save the user", async () => {
    await request(app)
      .post("/users")
      .send({
        email: "usermodeltest@gmail.com",
        name: "Test User",
        password:
          "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
      })
      .expect(201);
  });
});
