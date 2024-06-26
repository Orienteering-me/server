import request from "supertest";
import { expect } from "chai";
import { app } from "../../src/app.js";
import { User } from "../../src/models/user.js";
import jwt from "jsonwebtoken";
import { Auth } from "../../src/models/auth.js";
import { Course } from "../../src/models/course.js";

const testUser = {
  email: "userroutetest@gmail.com",
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

describe("GET /users", () => {
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

  it("Must get a user with the token data", async () => {
    const response = await request(app)
      .get("/users")
      .set("Access-Token", accessToken)
      .expect(200);

    expect(response.body).to.include({
      email: "userroutetest@gmail.com",
      name: "Test User",
      phone_number: "123456789",
    });
    expect(response.body).to.not.include({
      password: "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
    });
  });

  // The 404 status code is difficult to force without triggering a 401 status code before
});

describe("GET /users/courses", () => {
  beforeEach(async () => {
    await User.deleteMany();
    const savedUser = await new User(testUser).save();
    const testAuth = {
      user: savedUser!._id,
      access_token: accessToken,
      refresh_token: refreshToken,
    };
    await new Auth(testAuth).save();
    await Course.deleteMany();
    await new Course({
      admin: savedUser!._id,
      name: "CourseRouteTest",
      checkpoints: [],
    }).save();
  });

  it("Must get the courses created by a user with the token data", async () => {
    const response = await request(app)
      .get("/users/courses")
      .set("Access-Token", accessToken)
      .expect(200);

    expect(response.body.courses.length).to.equal(1);
    expect(response.body.courses[0]).to.include({
      name: "CourseRouteTest",
    });
  });

  // The 404 status code is difficult to force without triggering a 401 status code before
});

describe("PATCH /users", () => {
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

  it("Must update a user", async () => {
    const response = await request(app)
      .patch("/users")
      .set("Access-Token", accessToken)
      .send({
        email: "userroutetest2@gmail.com",
        name: "New Test User",
        phone_number: "323456789",
        password: "Testuser123",
      })
      .expect(200);
    const responseAccessToken = jwt.verify(
      response.body.access_token!,
      process.env.JWT_ACCESS_SECRET!
    );
    expect((<any>responseAccessToken).email).to.equal(
      "userroutetest2@gmail.com"
    );
    expect((<any>responseAccessToken).exp).to.equal(
      (<any>responseAccessToken).iat + 30 * 60
    );
    const responseRefreshToken = jwt.verify(
      response.body.refresh_token!,
      process.env.JWT_REFRESH_SECRET!
    );
    expect((<any>responseRefreshToken).email).to.equal(
      "userroutetest2@gmail.com"
    );
    expect((<any>responseRefreshToken).exp).to.equal(
      (<any>responseRefreshToken).iat + 48 * 60 * 60
    );
  });

  it("Must get an error because the update is forbidden", async () => {
    await request(app)
      .patch("/users")
      .set("Access-Token", accessToken)
      .send({
        email: "userroutetest2@gmail.com",
        name: "New Test User",
        phone_number: "323456789",
        password: "Testuser123",
        age: 15,
      })
      .expect(400);

    const updatedUser = await User.findOne({
      email: "userroutetest@gmail.com",
    });
    expect(updatedUser).to.not.be.null;
  });

  // The 404 status code is difficult to force without triggering a 401 status code before

  it("Must get an error because a user with the new email already exists", async () => {
    await new User({
      email: "userroutetest2@gmail.com",
      name: "Test User",
      phone_number: "123456789",
      password: "Testuser123",
    }).save();

    await request(app)
      .patch("/users")
      .set("Access-Token", accessToken)
      .send({
        email: "userroutetest2@gmail.com",
        name: "New Test User",
        phone_number: "323456789",
        password: "Testuser123",
      })
      .expect(409);

    const updatedUser = await User.findOne({
      email: "userroutetest@gmail.com",
    });
    expect(updatedUser).to.not.be.null;
  });

  it("Must get an error because the body is malformed", async () => {
    await request(app)
      .patch("/users")
      .set("Access-Token", accessToken)
      .send({
        email: "userroutetest2",
        name: "New Test User",
        phone_number: "323456789",
        password: "Testuser123",
      })
      .expect(500);

    const updatedUser = await User.findOne({
      email: "userroutetest@gmail.com",
    });
    expect(updatedUser).to.not.be.null;
  });
});

describe("DELETE /users", () => {
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

  it("Must delete a user", async () => {
    await request(app)
      .delete("/users")
      .set("Access-Token", accessToken)
      .expect(200);

    const deletedUser = await User.findOne({
      email: "userroutetest@gmail.com",
    });
    expect(deletedUser).to.be.null;
  });

  // The 404 status code is difficult to force without triggering a 401 status code before
});
