import request from "supertest";
import { expect } from "chai";
import { app } from "../../src/app.js";
import { User } from "../../src/models/user.js";
import jwt from "jsonwebtoken";

const testUser = {
  email: "logintest@gmail.com",
  name: "Test User",
  phone_number: "123456789",
  password: "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
};

describe("POST /login", () => {
  beforeEach(async () => {
    await User.deleteMany();
    await new User(testUser).save();
  });

  it("Must login using the correct password", async () => {
    const response = await request(app)
      .post("/login")
      .send({
        email: "logintest@gmail.com",
        password: "Testuser123",
      })
      .expect(200);

    const token = jwt.verify(
      response.body.token!.toString(),
      process.env.JWT_SECRET!
    );
    expect((<any>token).domain).to.equal("orienteering.me");
    expect((<any>token).email).to.equal("logintest@gmail.com");
    expect((<any>token).exp).to.equal((<any>token).iat + 48 * 60 * 60);
    expect((<any>token).password).to.be.undefined;
  });

  it("Must get an error because the password is wrong", async () => {
    await request(app)
      .post("/login")
      .send({
        email: "logintest@gmail.com",
        password: "testuser",
      })
      .expect(401);
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

  it("Must get an error because the body is malformed", async () => {
    await request(app)
      .post("/login")
      .send({
        email: "logintest@gmail.com",
      })
      .expect(500);
  });
});
