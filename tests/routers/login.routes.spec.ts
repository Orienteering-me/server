import request from "supertest";
import { expect } from "chai";
import { app } from "../../src/app.js";
import { User } from "../../src/models/user.js";

const testUser = {
  email: "testuser1@gmail.com",
  name: "Test User",
  phone_number: "123456789",
  password: "Testuser123",
};

beforeEach(async () => {
  await User.deleteMany();
  await new User(testUser).save();
});

describe("POST /login", () => {
  it("Must get user data using the correct password", async () => {
    const response = await request(app)
      .post("/login")
      .send({
        email: "testuser1@gmail.com",
        password: "Testuser123",
      })
      .expect(200);

    expect(response.body).to.include({
      email: "testuser1@gmail.com",
      name: "Test User",
      phone_number: "123456789",
    });
    expect(response.body).to.not.include({
      password: "Testuser123",
    });
  });

  it("Must get an error because the password is wrong", async () => {
    await request(app)
      .post("/login")
      .send({
        email: "testuser1@gmail.com",
        password: "testuser",
      })
      .expect(400);
  });

  it("Must get an error because the user wasn't found", async () => {
    await request(app)
      .post("/login")
      .send({
        email: "testuser5@gmail.com",
        password: "Testuser123",
      })
      .expect(404);
  });
});
