import request from "supertest";
import { expect } from "chai";
import { app } from "../../src/app.js";
import { User } from "../../src/models/user.js";
import jwt from "jsonwebtoken";

const testUser = {
  email: "userroutetest@gmail.com",
  name: "Test User",
  phone_number: "123456789",
  password: "Testuser123",
};

const token = jwt.sign(
  {
    domain: "orienteering.me",
    email: "userroutetest@gmail.com",
  },
  process.env.DIY_JWT_SECRET!
);

describe("POST /users", () => {
  beforeEach(async () => {
    await User.deleteMany();
    await new User(testUser).save();
  });

  it("Must create a new user", async () => {
    const response = await request(app)
      .post("/users")
      .send({
        email: "userroutetest2@gmail.com",
        name: "New Test User",
        phone_number: "123456789",
        password:
          "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
      })
      .expect(201);

    expect(response.body).to.include({
      email: "userroutetest2@gmail.com",
    });
    expect(response.body).to.not.include({
      password: "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
    });

    const NewTestUser = await User.findOne({
      email: response.body.email,
    });
    expect(NewTestUser!.email).to.equal("userroutetest2@gmail.com");
  });

  it("Must get an error because the user already exists", async () => {
    await request(app).post("/users").send(testUser).expect(409);
  });

  it("Must get an error because the body is malformed", async () => {
    await request(app)
      .post("/users")
      .send({
        email: "userroutetest2@gmail.com",
        name: "New Test User",
        phone_number: "123456789",
      })
      .expect(500);
  });
});

describe("GET /users", () => {
  beforeEach(async () => {
    await User.deleteMany();
    await new User(testUser).save();
  });

  it("Must get a user with the token data a new user", async () => {
    const response = await request(app)
      .get("/users")
      .set("auth-token", token)
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

  it("Must get an error because the token can't be verified", async () => {
    await request(app)
      .get("/users")
      .set(
        "auth-token",
        jwt.sign(
          {
            domain: "orienteering.me",
            email: "userroutetest@gmail.com",
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
        "auth-token",
        jwt.sign(
          {
            domain: "orienteering.me",
            email: "userroutetest2@gmail.com",
          },
          process.env.DIY_JWT_SECRET!
        )
      )
      .expect(404);
  });
});

describe("PATCH /users", () => {
  beforeEach(async () => {
    await User.deleteMany();
    await new User(testUser).save();
  });

  it("Must update a user", async () => {
    const response = await request(app)
      .patch("/users")
      .set("auth-token", token)
      .send({
        email: "userroutetest2@gmail.com",
        name: "New Test User",
        phone_number: "323456789",
        password: "Testuser123",
      })
      .expect(200);

    const responseToken = jwt.verify(
      response.body.token!.toString(),
      process.env.DIY_JWT_SECRET!
    );
    expect((<any>responseToken).domain).to.equal("orienteering.me");
    expect((<any>responseToken).email).to.equal("userroutetest2@gmail.com");
    expect((<any>token).password).to.be.undefined;

    const UpdatedUser = await User.findOne({
      email: (<any>responseToken).email,
    });
    expect(UpdatedUser!.email).to.equal("userroutetest2@gmail.com");
  });

  it("Must get an error because the token can't be verified", async () => {
    await request(app)
      .patch("/users")
      .set(
        "auth-token",
        jwt.sign(
          {
            domain: "orienteering.me",
            email: "userroutetest@gmail.com",
          },
          "WRONG_JWT_SECRET"
        )
      )
      .send({
        email: "userroutetest2@gmail.com",
        name: "New Test User",
        phone_number: "323456789",
        password: "Testuser123",
      })
      .expect(401);

    const UpdatedUser = await User.findOne({
      email: "userroutetest@gmail.com",
    });
    expect(UpdatedUser!.email).to.equal("userroutetest@gmail.com");
  });

  it("Must get an error because a token is expected", async () => {
    await request(app)
      .patch("/users")
      .send({
        email: "userroutetest2@gmail.com",
        name: "New Test User",
        phone_number: "323456789",
        password: "Testuser123",
      })
      .expect(401);

    const UpdatedUser = await User.findOne({
      email: "userroutetest@gmail.com",
    });
    expect(UpdatedUser!.email).to.equal("userroutetest@gmail.com");
  });

  it("Must get an error because the update is forbidden", async () => {
    await request(app)
      .patch("/users")
      .set("auth-token", token)
      .send({
        email: "userroutetest2@gmail.com",
        name: "New Test User",
        phone_number: "323456789",
        password: "Testuser123",
        age: 15,
      })
      .expect(400);

    const UpdatedUser = await User.findOne({
      email: "userroutetest@gmail.com",
    });
    expect(UpdatedUser!.email).to.equal("userroutetest@gmail.com");
  });

  it("Must get an error because the user wasn't found", async () => {
    await request(app)
      .patch("/users")
      .set(
        "auth-token",
        jwt.sign(
          {
            domain: "orienteering.me",
            email: "doesntexist@gmail.com",
          },
          process.env.DIY_JWT_SECRET!
        )
      )
      .send({
        email: "userroutetest2@gmail.com",
        name: "New Test User",
        phone_number: "323456789",
        password: "Testuser123",
      })
      .expect(404);

    const UpdatedUser = await User.findOne({
      email: "userroutetest@gmail.com",
    });
    expect(UpdatedUser!.email).to.equal("userroutetest@gmail.com");
  });

  it("Must get an error because the user already exists", async () => {
    await new User({
      email: "userroutetest2@gmail.com",
      name: "Test User",
      phone_number: "123456789",
      password: "Testuser123",
    }).save();

    await request(app)
      .patch("/users")
      .set("auth-token", token)
      .send({
        email: "userroutetest2@gmail.com",
        name: "New Test User",
        phone_number: "323456789",
        password: "Testuser123",
      })
      .expect(409);

    const UpdatedUser = await User.findOne({
      email: "userroutetest@gmail.com",
    });
    expect(UpdatedUser!.email).to.equal("userroutetest@gmail.com");
  });

  it("Must get an error because the body is malformed", async () => {
    await request(app)
      .patch("/users")
      .set("auth-token", token)
      .send({
        email: "userroutetest2",
        name: "New Test User",
        phone_number: "323456789",
        password: "Testuser123",
      })
      .expect(500);

    const UpdatedUser = await User.findOne({
      email: "userroutetest@gmail.com",
    });
    expect(UpdatedUser!.email).to.equal("userroutetest@gmail.com");
  });
});

describe("DELETE /users", () => {
  beforeEach(async () => {
    await User.deleteMany();
    await new User(testUser).save();
  });

  it("Must delete a user", async () => {
    const response = await request(app)
      .delete("/users")
      .set("auth-token", token)
      .expect(200);

    expect(response.body).to.include({
      email: "userroutetest@gmail.com",
    });
    const DeletedUser = await User.findOne({
      email: response.body.email,
    });
    expect(DeletedUser).to.be.null;
  });

  it("Must get an error because the token can't be verified", async () => {
    await request(app)
      .delete("/users")
      .set(
        "auth-token",
        jwt.sign(
          {
            domain: "orienteering.me",
            email: "userroutetest@gmail.com",
          },
          "WRONG_JWT_SECRET"
        )
      )
      .expect(401);

    const DeletedUser = await User.findOne({
      email: "userroutetest@gmail.com",
    });
    expect(DeletedUser).not.to.be.null;
  });

  it("Must get an error because a token is expected", async () => {
    await request(app).delete("/users").expect(401);

    const DeletedUser = await User.findOne({
      email: "userroutetest@gmail.com",
    });
    expect(DeletedUser).not.to.be.null;
  });

  it("Must get an error because the user wasn't found", async () => {
    await request(app)
      .delete("/users")
      .set(
        "auth-token",
        jwt.sign(
          {
            domain: "orienteering.me",
            email: "doesntexist@gmail.com",
          },
          process.env.DIY_JWT_SECRET!
        )
      )
      .expect(404);
  });
});
