import request from "supertest";
import { app } from "../../src/app.js";
import { Course } from "../../src/models/course.js";
import { User } from "../../src/models/user.js";
import jwt from "jsonwebtoken";
import { Auth } from "../../src/models/auth.js";

const testUser = {
  email: "coursemodeltest@gmail.com",
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

describe("Course Model", () => {
  beforeEach(async () => {
    await Course.deleteMany();
    await User.deleteMany();
    const savedUser = await new User(testUser).save();
    const testAuth = {
      user: savedUser!._id,
      access_token: accessToken,
      refresh_token: refreshToken,
    };
    await new Auth(testAuth).save();
  });

  it("Must get an error because the name is required", async () => {
    await request(app)
      .post("/courses")
      .set("access-token", accessToken)
      .send({ admin: "coursemodeltest@gmail.com", checkpoints: [] })
      .expect(500);
  });

  it("Must get an error because the name format is wrong", async () => {
    await request(app)
      .post("/courses")
      .set("access-token", accessToken)
      .send({
        name: "CourseModelTest&",
        admin: "coursemodeltest@gmail.com",
        checkpoints: [],
      })
      .expect(500);
  });

  // The admin is taken from the auth token, so if the action is authorized it will always have it

  it("Must get an error because the checkpoints are required", async () => {
    await request(app)
      .post("/courses")
      .set("access-token", accessToken)
      .send({
        name: "CourseModelTest",
        admin: "coursemodeltest@gmail.com",
      })
      .expect(500);
  });

  it("Must save the course", async () => {
    await request(app)
      .post("/courses")
      .set("access-token", accessToken)
      .send({
        admin: "coursemodeltest@gmail.com",
        name: "CourseModelTest",
        checkpoints: [],
      })
      .expect(201);
  });
});
