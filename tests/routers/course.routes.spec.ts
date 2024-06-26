import request from "supertest";
import { expect } from "chai";
import { app } from "../../src/app.js";
import { User } from "../../src/models/user.js";
import jwt from "jsonwebtoken";
import { Auth } from "../../src/models/auth.js";
import { Course } from "../../src/models/course.js";
import bcrypt from "bcryptjs";
import { Checkpoint } from "../../src/models/checkpoint.js";

const testUser = {
  email: "courseroutetest@gmail.com",
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

describe("POST /courses", () => {
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

  it("Must create a new course", async () => {
    await request(app)
      .post("/courses")
      .set("access-token", accessToken)
      .send({
        name: "CourseRouteTest",
        checkpoints: [
          { number: 0, lat: 0, lng: 0 },
          { number: 1, lat: 1, lng: 1 },
        ],
      })
      .expect(201);
  });

  it("Must get an error because a course with the same name already exists", async () => {
    const savedUser = await User.findOne({ email: testUser.email });
    await new Course({
      admin: savedUser!._id,
      name: "CourseRouteTest",
      checkpoints: [],
    }).save();

    await request(app)
      .post("/courses")
      .set("access-token", accessToken)
      .send({
        name: "CourseRouteTest",
        checkpoints: [],
      })
      .expect(409);
  });

  // The 404 status code is difficult to force without triggering a 401 status code before

  it("Must get an error because the body is malformed", async () => {
    await request(app)
      .post("/courses")
      .set("access-token", accessToken)
      .send({
        name: "CourseRouteTest",
      })
      .expect(500);
  });
});

describe("GET /courses", () => {
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

  it("Must get all the courses saved", async () => {
    const savedUser = await User.findOne({ email: testUser.email });
    await new Course({
      admin: savedUser!._id,
      name: "CourseRouteTest1",
      checkpoints: [],
    }).save();
    await new Course({
      admin: savedUser!._id,
      name: "CourseRouteTest2",
      checkpoints: [],
    }).save();
    const response = await request(app)
      .get("/courses")
      .set("Access-Token", accessToken)
      .expect(200);

    expect(response.body.courses.length).to.equal(2);
  });

  it("Must get an error because there isn't any courses saved", async () => {
    await request(app)
      .get("/courses")
      .set("Access-Token", accessToken)
      .expect(404);
  });
});

describe("GET /courses?name", () => {
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

  it("Must get a course by its name being admin", async () => {
    const savedUser = await User.findOne({ email: testUser.email });
    await new Course({
      admin: savedUser!._id,
      name: "CourseRouteTest",
      checkpoints: [],
    }).save();
    const response = await request(app)
      .get("/courses?name=CourseRouteTest")
      .set("Access-Token", accessToken)
      .expect(200);

    expect(response.body).to.include({
      is_admin: true,
      has_uploaded_times: false,
    });
    expect(response.body.course).to.include({
      name: "CourseRouteTest",
    });
    expect(response.body.course.admin).to.include({
      name: "Test User",
    });
  });

  it("Must get a course by its name not being admin", async () => {
    const savedUser = await new User({
      email: "courseroutetest2@gmail.com",
      name: "Test User2",
      password: "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
    }).save();
    await new Course({
      admin: savedUser!._id,
      name: "CourseRouteTest",
      checkpoints: [],
    }).save();
    const response = await request(app)
      .get("/courses?name=CourseRouteTest")
      .set("Access-Token", accessToken)
      .expect(200);

    expect(response.body).to.include({
      is_admin: false,
      has_uploaded_times: false,
    });
    expect(response.body.course).to.include({
      name: "CourseRouteTest",
    });
    expect(response.body.course.admin).to.include({
      name: "Test User2",
    });
  });

  it("Must get an error because there isn't any courses saved with this name", async () => {
    await request(app)
      .get("/courses?name=CourseRouteTest")
      .set("Access-Token", accessToken)
      .expect(404);
  });
});

describe("PATCH /courses", () => {
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
    const qrCode = await bcrypt.hash("CourseRouteTest&0", 10);
    const savedCourse = await new Course({
      admin: savedUser!._id,
      name: "CourseRouteTest",
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
  });

  it("Must update a course", async () => {
    await request(app)
      .patch("/courses?name=CourseRouteTest")
      .set("Access-Token", accessToken)
      .send({
        name: "CourseRouteTest2",
        checkpoints: [{ number: 0, lat: 0, lng: 0 }],
      })
      .expect(200);

    const updatedCourse = await Course.findOne({
      name: "CourseRouteTest2",
    });
    expect(updatedCourse).to.not.be.null;
  });

  it("Must get an error because the update is forbidden", async () => {
    await request(app)
      .patch("/courses?name=CourseRouteTest")
      .set("Access-Token", accessToken)
      .send({
        name: "CourseRouteTest2",
        length: 100,
      })
      .expect(400);

    const updatedCourse = await Course.findOne({
      name: "CourseRouteTest",
    });
    expect(updatedCourse).to.not.be.null;
  });

  it("Must get an error because the query doesn't include the course name", async () => {
    await request(app)
      .patch("/courses")
      .set("Access-Token", accessToken)
      .send({
        name: "CourseRouteTest2",
        checkpoints: [{ number: 0, lat: 0, lng: 0 }],
      })
      .expect(400);

    const updatedCourse = await Course.findOne({
      name: "CourseRouteTest",
    });
    expect(updatedCourse).to.not.be.null;
  });

  it("Must get an error because the course doesn't exist", async () => {
    await request(app)
      .patch("/courses?name=CourseRouteTest3")
      .set("Access-Token", accessToken)
      .send({
        name: "CourseRouteTest2",
        checkpoints: [{ number: 0, lat: 0, lng: 0 }],
      })
      .expect(404);
  });

  it("Must get an error because the user isn't the admin", async () => {
    const savedUser = await new User({
      email: "courseroutetest2@gmail.com",
      name: "Test User2",
      password: "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
    }).save();
    await new Course({
      admin: savedUser!._id,
      name: "CourseRouteTest2",
      checkpoints: [],
    }).save();
    await request(app)
      .patch("/courses?name=CourseRouteTest2")
      .set("Access-Token", accessToken)
      .send({
        name: "CourseRouteTest3",
        checkpoints: [{ number: 0, lat: 0, lng: 0 }],
      })
      .expect(401);

    const updatedCourse = await Course.findOne({
      name: "CourseRouteTest2",
    });
    expect(updatedCourse).to.not.be.null;
  });

  it("Must get an error because a course with the new name already exists", async () => {
    const savedUser = await User.findOne({ email: testUser.email });
    await new Course({
      admin: savedUser!._id,
      name: "CourseRouteTest2",
      checkpoints: [],
    }).save();
    await request(app)
      .patch("/courses?name=CourseRouteTest")
      .set("Access-Token", accessToken)
      .send({
        name: "CourseRouteTest2",
        checkpoints: [{ number: 0, lat: 0, lng: 0 }],
      })
      .expect(409);

    const updatedCourse = await Course.findOne({
      name: "CourseRouteTest",
    });
    expect(updatedCourse).to.not.be.null;
  });

  it("Must get an error because the body is malformed", async () => {
    await request(app)
      .patch("/courses?name=CourseRouteTest")
      .set("Access-Token", accessToken)
      .send({
        name: "CourseRouteTest2",
      })
      .expect(500);

    const updatedCourse = await Course.findOne({
      name: "CourseRouteTest",
    });
    expect(updatedCourse).to.not.be.null;
  });
});

describe("DELETE /courses", () => {
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

  it("Must delete a user", async () => {
    await request(app)
      .delete("/courses?name=CourseRouteTest")
      .set("Access-Token", accessToken)
      .send()
      .expect(200);

    const deletedCourse = await Course.findOne({
      name: "CourseRouteTest",
    });
    expect(deletedCourse).to.be.null;
  });

  it("Must get an error because the query doesn't include the course name", async () => {
    await request(app)
      .delete("/courses")
      .set("Access-Token", accessToken)
      .send()
      .expect(400);

    const deletedCourse = await Course.findOne({
      name: "CourseRouteTest",
    });
    expect(deletedCourse).to.not.be.null;
  });

  it("Must get an error because the course doesn't exist", async () => {
    await request(app)
      .delete("/courses?name=CourseRouteTest3")
      .set("Access-Token", accessToken)
      .send()
      .expect(404);

    const deletedCourse = await Course.findOne({
      name: "CourseRouteTest",
    });
    expect(deletedCourse).to.not.be.null;
  });

  it("Must get an error because the user isn't the admin", async () => {
    const savedUser = await new User({
      email: "courseroutetest2@gmail.com",
      name: "Test User2",
      password: "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
    }).save();
    await new Course({
      admin: savedUser!._id,
      name: "CourseRouteTest2",
      checkpoints: [],
    }).save();
    await request(app)
      .delete("/courses?name=CourseRouteTest2")
      .set("Access-Token", accessToken)
      .send()
      .expect(401);

    const deletedCourse = await Course.findOne({
      name: "CourseRouteTest2",
    });
    expect(deletedCourse).to.not.be.null;
  });
});
