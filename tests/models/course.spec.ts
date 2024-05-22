import request from "supertest";
import { app } from "../../src/app.js";
import { Course } from "../../src/models/course.js";
import { User } from "../../src/models/user.js";
import jwt from "jsonwebtoken";

const testUser = {
  email: "coursemodeltest@gmail.com",
  name: "Test User",
  phone_number: "123456789",
  password: "Testuser123",
};

const token = jwt.sign(
  {
    domain: "orienteering.me",
    email: "coursemodeltest@gmail.com",
  },
  process.env.JWT_SECRET!
);

describe("Course Model", () => {
  beforeEach(async () => {
    await Course.deleteMany();
    await User.deleteMany();
    await new User(testUser).save();
  });

  it("Must get an error because the name is required", async () => {
    await request(app)
      .post("/courses")
      .set("auth-token", token)
      .send({ admin: "coursemodeltest@gmail.com", checkpoints: [] })
      .expect(500);
  });

  // The admin is taken from the auth token, so if the action is authorized it will always have it

  it("Must get an error because the checkpoints are required", async () => {
    await request(app)
      .post("/courses")
      .set("auth-token", token)
      .send({
        admin: "coursemodeltest@gmail.com",
        name: "CourseModelTest",
      })
      .expect(500);
  });

  it("Must save the course", async () => {
    await request(app)
      .post("/courses")
      .set("auth-token", token)
      .send({
        admin: "coursemodeltest@gmail.com",
        name: "CourseModelTest",
        checkpoints: [],
      })
      .expect(201);
  });
});
