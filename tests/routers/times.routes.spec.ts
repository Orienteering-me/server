import request from "supertest";
import { expect } from "chai";
import { app } from "../../src/app.js";
import { User } from "../../src/models/user.js";
import jwt from "jsonwebtoken";
import { Auth } from "../../src/models/auth.js";
import { Course } from "../../src/models/course.js";
import bcrypt from "bcryptjs";
import { Checkpoint } from "../../src/models/checkpoint.js";
import { CheckpointTime } from "../../src/models/time.js";

const testUser = {
  email: "timeroutetest@gmail.com",
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

describe("POST /times", () => {
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
  });
});

describe("GET /times", () => {
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
    const qrCode = await bcrypt.hash("TimeRouteTest&0", 10);
    const savedCourse = await new Course({
      admin: savedUser!._id,
      name: "TimesRouteTest",
      checkpoints: [],
    }).save();
    const savedCheckpoint = await new Checkpoint({
      course: savedCourse._id,
      number: 0,
      lat: 0,
      lng: 0,
      qr_code: qrCode,
    }).save();
    await savedCourse.updateOne({ checkpoints: [savedCheckpoint._id] });
    await new CheckpointTime({
      user: savedUser!._id,
      course: savedCourse._id,
      checkpoint: savedCheckpoint._id,
      time: 1000000,
    }).save();
  });

  it("Must get all the times saved for a course", async () => {
    const response = await request(app)
      .get("/times?course=TimesRouteTest")
      .set("Access-Token", accessToken)
      .expect(200);

    expect(response.body.results.length).to.equal(1);
    expect(response.body.has_uploaded).to.equal(true);
    expect(response.body.is_admin).to.equal(true);
  });

  it("Must get an error because the query doesn't include the course name", async () => {
    await request(app)
      .get("/times")
      .set("Access-Token", accessToken)
      .expect(400);
  });

  it("Must get an error because the course doesn't exist", async () => {
    await request(app)
      .get("/times?course=TimesRouteTest2")
      .set("Access-Token", accessToken)
      .expect(404);
  });
});

describe("GET /times/uploaded", () => {
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
    const qrCode = await bcrypt.hash("TimeRouteTest&0", 10);
    const savedCourse = await new Course({
      admin: savedUser!._id,
      name: "TimesRouteTest",
      checkpoints: [],
    }).save();
    const savedCheckpoint = await new Checkpoint({
      course: savedCourse._id,
      number: 0,
      lat: 0,
      lng: 0,
      qr_code: qrCode,
    }).save();
    await savedCourse.updateOne({ checkpoints: [savedCheckpoint._id] });
    await new CheckpointTime({
      user: savedUser!._id,
      course: savedCourse._id,
      checkpoint: savedCheckpoint._id,
      time: 1000000,
    }).save();
  });

  it("Must get all the times uploaded by the user for a course", async () => {
    const response = await request(app)
      .get("/times/uploaded?course=TimesRouteTest")
      .set("Access-Token", accessToken)
      .expect(200);

    expect(response.body.times.length).to.equal(1);
    expect(response.body.is_admin).to.equal(true);
  });

  it("Must get an error because the query doesn't include the course name", async () => {
    await request(app)
      .get("/times/uploaded")
      .set("Access-Token", accessToken)
      .expect(400);
  });

  it("Must get an error because the course doesn't exist", async () => {
    await request(app)
      .get("/times/uploaded?course=TimesRouteTest2")
      .set("Access-Token", accessToken)
      .expect(404);
  });

  // The 404 status code when the user doesn't exist is difficult to force without triggering a 401 status code before
});

describe("DELETE /times", () => {
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
    const qrCode = await bcrypt.hash("TimeRouteTest&0", 10);
    const savedCourse = await new Course({
      admin: savedUser!._id,
      name: "TimesRouteTest",
      checkpoints: [],
    }).save();
    const savedCheckpoint = await new Checkpoint({
      course: savedCourse._id,
      number: 0,
      lat: 0,
      lng: 0,
      qr_code: qrCode,
    }).save();
    await savedCourse.updateOne({ checkpoints: [savedCheckpoint._id] });
    await new CheckpointTime({
      user: savedUser!._id,
      course: savedCourse._id,
      checkpoint: savedCheckpoint._id,
      time: 1000000,
    }).save();
  });

  it("Must delete a time", async () => {
    await request(app)
      .delete("/times?course=TimesRouteTest&email=timeroutetest@gmail.com")
      .set("Access-Token", accessToken)
      .send()
      .expect(200);
  });

  it("Must get an error because the query doesn't include the course name", async () => {
    await request(app)
      .delete("/times?email=timeroutetest@gmail.com")
      .set("Access-Token", accessToken)
      .send()
      .expect(400);
  });

  it("Must get an error because the query doesn't include the user email", async () => {
    await request(app)
      .delete("/times?course=TimesRouteTest")
      .set("Access-Token", accessToken)
      .send()
      .expect(400);
  });

  it("Must get an error because the course doesn't exist", async () => {
    await request(app)
      .delete("/times?course=TimesRouteTest2&email=timeroutetest@gmail.com")
      .set("Access-Token", accessToken)
      .send()
      .expect(404);
  });

  it("Must get an error because the user doesn't exist", async () => {
    await request(app)
      .delete("/times?course=TimesRouteTest&email=timeroutetest2@gmail.com")
      .set("Access-Token", accessToken)
      .send()
      .expect(404);
  });

  it("Must get an error because the user isn't the admin", async () => {
    const savedUser = await new User({
      email: "timeroutetest2@gmail.com",
      name: "Test User",
      phone_number: "123456789",
      password: "Testuser123",
    }).save();
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
    await new Auth({
      user: savedUser!._id,
      access_token: accessToken,
      refresh_token: refreshToken,
    }).save();
    await request(app)
      .delete("/times?course=TimesRouteTest&email=timeroutetest@gmail.com")
      .set("Access-Token", accessToken)
      .send()
      .expect(401);
  });

  it("Must get an error because the user doesn't exist", async () => {
    await new User({
      email: "timeroutetest2@gmail.com",
      name: "Test User",
      phone_number: "123456789",
      password: "Testuser123",
    }).save();
    await request(app)
      .delete("/times?course=TimesRouteTest&email=timeroutetest2@gmail.com")
      .set("Access-Token", accessToken)
      .send()
      .expect(404);
  });
});
