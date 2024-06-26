import request from "supertest";
import { expect } from "chai";
import { app } from "../src/app.js";
import { User } from "../src/models/user.js";
import jwt from "jsonwebtoken";
import { Auth } from "../src/models/auth.js";

const testUser = {
  email: "appmiddlewaretest@gmail.com",
  name: "Test User",
  phone_number: "123456789",
  password: "Testuser123",
};

const accessToken = jwt.sign(
  {
    email: testUser.email,
  },
  process.env.JWT_ACCESS_SECRET!
);

const refreshToken = jwt.sign(
  {
    email: testUser.email,
  },
  process.env.JWT_REFRESH_SECRET!
);

describe("Auth middleware", () => {
  beforeEach(async () => {
    await User.deleteMany();
    const savedUser = await new User(testUser).save();
    const testAuth = {
      user: savedUser!._id,
      access_token: accessToken,
      refresh_token: refreshToken,
    };
    await new Auth(testAuth).save();
  });

  it("Must get an error because the token can't be verified", async () => {
    await request(app)
      .get("/users")
      .set(
        "Access-Token",
        jwt.sign(
          {
            domain: "orienteering.me",
            email: "appmiddlewaretest@gmail.com",
          },
          "WRONG_JWT_SECRET"
        )
      )
      .expect(401);
  });

  it("Must get an error because a token is expected", async () => {
    await request(app).get("/users").expect(401);
  });

  it("Must get an error because the user doesn't exist", async () => {
    await request(app)
      .get("/users")
      .set(
        "Access-Token",
        jwt.sign(
          {
            email: "falseuser@gmail.com",
          },
          process.env.JWT_ACCESS_SECRET!
        )
      )
      .expect(401);
  });

  it("Must get an error because the user hasn't logged in", async () => {
    const savedUser = await new User({
      email: "appmiddlewaretest2@gmail.com",
      name: "Test User",
      phone_number: "123456789",
      password: "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
    }).save();
    await request(app)
      .get("/users")
      .set(
        "Access-Token",
        jwt.sign(
          {
            email: savedUser.email,
          },
          process.env.JWT_ACCESS_SECRET!
        )
      )
      .expect(401);
  });

  it("Must get an error because the access token isn't the one saved in the database", async () => {
    await request(app)
      .get("/users")
      .set(
        "Access-Token",
        jwt.sign(
          {
            email: testUser.email,
          },
          process.env.JWT_ACCESS_SECRET!
        )
      )
      .expect(401);
  });
});
