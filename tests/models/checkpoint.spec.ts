import request from "supertest";
import { app } from "../../src/app.js";
import { Course } from "../../src/models/course.js";
import { User } from "../../src/models/user.js";
import jwt from "jsonwebtoken";
import { Auth } from "../../src/models/auth.js";

const testUser = {
  email: "checkpointmodeltest@gmail.com",
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

describe("Checkpoint Model", function () {
  this.timeout(5000);

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

  // The checkpoint always have a course because it's saved with a POST in the course route

  it("Must get an error because the number is required", async () => {
    await request(app)
      .post("/courses")
      .set("access-token", accessToken)
      .send({
        admin: "coursemodeltest@gmail.com",
        name: "CourseModelTest",
        checkpoints: [{ lat: 10, lng: 10 }],
      })
      .expect(500);
  });

  it("Must get an error because the number must be a whole number >= 0", async () => {
    await request(app)
      .post("/courses")
      .set("access-token", accessToken)
      .send({
        admin: "coursemodeltest@gmail.com",
        name: "CourseModelTest",
        checkpoints: [{ number: -1, lat: 10, lng: 10 }],
      })
      .expect(500);

    await request(app)
      .post("/courses")
      .set("access-token", accessToken)
      .send({
        admin: "coursemodeltest@gmail.com",
        name: "CourseModelTest",
        checkpoints: [{ number: 0.5, lat: 10, lng: 10 }],
      })
      .expect(500);
  });

  it("Must get an error because the latitude must be between -90 and 90", async () => {
    await request(app)
      .post("/courses")
      .set("access-token", accessToken)
      .send({
        admin: "coursemodeltest@gmail.com",
        name: "CourseModelTest",
        checkpoints: [{ number: 0, lat: -91, lng: 10 }],
      })
      .expect(500);

    await request(app)
      .post("/courses")
      .set("access-token", accessToken)
      .send({
        admin: "coursemodeltest@gmail.com",
        name: "CourseModelTest",
        checkpoints: [{ number: 0, lat: 91, lng: 10 }],
      })
      .expect(500);
  });

  it("Must get an error because the longitude must be between -180 and 180", async () => {
    await request(app)
      .post("/courses")
      .set("access-token", accessToken)
      .send({
        admin: "coursemodeltest@gmail.com",
        name: "CourseModelTest",
        checkpoints: [{ number: 0, lat: 10, lng: -181 }],
      })
      .expect(500);

    await request(app)
      .post("/courses")
      .set("access-token", accessToken)
      .send({
        admin: "coursemodeltest@gmail.com",
        name: "CourseModelTest",
        checkpoints: [{ number: 0, lat: 10, lng: 181 }],
      })
      .expect(500);
  });

  // The QR code is required and is generated automatically with the course name and the number, so the checkpoint will always have it
});
