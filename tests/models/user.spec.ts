import request from "supertest";
import { app } from "../../src/app.js";
import { expect } from "chai";
import { User } from "../../src/models/user.js";
import { Course } from "../../src/models/course.js";
import { Auth } from "../../src/models/auth.js";
import jwt from "jsonwebtoken";

describe("User Model", () => {
  beforeEach(async () => {
    await User.deleteMany();
  });

  it("Must get an error because the email is required", async () => {
    await request(app)
      .post("/register")
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
      .post("/register")
      .send({
        email: "testuser",
        name: "Test User",
        phone_number: "123456789",
        password:
          "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
      })
      .expect(500);

    await request(app)
      .post("/register")
      .send({
        email: "testuser@.com",
        name: "Test User",
        phone_number: "123456789",
        password:
          "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
      })
      .expect(500);

    await request(app)
      .post("/register")
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
      .post("/register")
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
      .post("/register")
      .send({
        email: "usermodeltest@gmail.com",
        name: "Test User",
        phone_number: "123",
        password:
          "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
      })
      .expect(500);

    await request(app)
      .post("/register")
      .send({
        email: "usermodeltest@gmail.com",
        name: "Test User",
        phone_number: "0",
        password:
          "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
      })
      .expect(500);

    await request(app)
      .post("/register")
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
      .post("/register")
      .send({
        email: "usermodeltest@gmail.com",
        name: "Test User",
        phone_number: "123456789",
      })
      .expect(500);
  });

  it("Must save the user", async () => {
    await request(app)
      .post("/register")
      .send({
        email: "usermodeltest@gmail.com",
        name: "Test User",
        password:
          "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
      })
      .expect(201);
  });

  it("Must delete the courses created by the user", async () => {
    const savedUser = await new User({
      email: "usermodeltest@gmail.com",
      name: "Test User",
      password: "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
    }).save();
    await new Course({
      admin: savedUser._id,
      name: "UserModelTest",
      checkpoints: [],
    }).save();
    const savedCourse = await Course.findOne({ name: "UserModelTest" });
    expect(savedCourse).to.not.be.null;
    await User.findByIdAndDelete(savedUser._id);
    const deletedCourse = await Course.findOne({ name: "UserModelTest" });
    expect(deletedCourse).to.be.null;
  });
});
