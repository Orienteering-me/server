import request from "supertest";
import { expect } from "chai";
import { app } from "../../src/app.js";
import { User } from "../../src/models/user.js";
import jwt from "jsonwebtoken";
import { Auth } from "../../src/models/auth.js";

const testUser = {
  email: "authroutetest@gmail.com",
  name: "Test User",
  phone_number: "123456789",
  password: "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
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

describe("POST /register", () => {
  beforeEach(async () => {
    await User.deleteMany();
    await new User(testUser).save();
  });

  it("Must create a new user", async () => {
    await request(app)
      .post("/register")
      .send({
        email: "authroutetest2@gmail.com",
        name: "New Test User",
        phone_number: "123456789",
        password:
          "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
      })
      .expect(201);
    const NewTestUser = await User.findOne({
      email: "authroutetest2@gmail.com",
    });
    expect(NewTestUser!.email).to.equal("authroutetest2@gmail.com");
  });

  it("Must get an error because the user already exists", async () => {
    await request(app).post("/register").send(testUser).expect(409);
  });

  it("Must get an error because the body is malformed", async () => {
    await request(app)
      .post("/register")
      .send({
        email: "userroutetest2@gmail.com",
        name: "New Test User",
        phone_number: "123456789",
      })
      .expect(500);
  });
});

describe("POST /login", () => {
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

  it("Must login using the correct password", async () => {
    const response = await request(app)
      .post("/login")
      .send({
        email: "authroutetest@gmail.com",
        password: "Testuser123",
      })
      .expect(200);
    const responseAccessToken = jwt.verify(
      response.body.access_token!,
      process.env.JWT_ACCESS_SECRET!
    );
    expect((<any>responseAccessToken).email).to.equal(
      "authroutetest@gmail.com"
    );
    expect((<any>responseAccessToken).exp).to.equal(
      (<any>responseAccessToken).iat + 30 * 60
    );
    const responseRefreshToken = jwt.verify(
      response.body.refresh_token!,
      process.env.JWT_REFRESH_SECRET!
    );
    expect((<any>responseRefreshToken).email).to.equal(
      "authroutetest@gmail.com"
    );
    expect((<any>responseRefreshToken).exp).to.equal(
      (<any>responseRefreshToken).iat + 48 * 60 * 60
    );
  });

  it("Must get an error because the password is wrong", async () => {
    await request(app)
      .post("/login")
      .send({
        email: "authroutetest@gmail.com",
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
      .expect(401);
  });

  it("Must get an error because the body is malformed", async () => {
    await request(app)
      .post("/login")
      .send({
        email: "authroutetest@gmail.com",
      })
      .expect(500);
  });
});

describe("POST /refresh", () => {
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

  it("Must refresh the token correctly", async () => {
    const response = await request(app)
      .post("/refresh")
      .set("Refresh-Token", refreshToken)
      .send()
      .expect(200);
    const responseAccessToken = jwt.verify(
      response.body.access_token!,
      process.env.JWT_ACCESS_SECRET!
    );
    expect((<any>responseAccessToken).email).to.equal(
      "authroutetest@gmail.com"
    );
    expect((<any>responseAccessToken).exp).to.equal(
      (<any>responseAccessToken).iat + 30 * 60
    );
    const responseRefreshToken = jwt.verify(
      response.body.refresh_token!,
      process.env.JWT_REFRESH_SECRET!
    );
    expect((<any>responseRefreshToken).email).to.equal(
      "authroutetest@gmail.com"
    );
    expect((<any>responseRefreshToken).exp).to.equal(
      (<any>responseRefreshToken).iat + 48 * 60 * 60
    );
  });

  it("Must get an error because the token isn't verified", async () => {
    await request(app)
      .post("/refresh")
      .set(
        "Refresh-Token",
        jwt.sign(
          {
            email: "authroutetest@gmail.com",
          },
          "WRONG_JWT_SECRET"
        )
      )
      .expect(401);
  });

  it("Must get an error because the user doesn't exist", async () => {
    await request(app)
      .post("/refresh")
      .set(
        "Refresh-Token",
        jwt.sign(
          {
            email: "falseuser@gmail.com",
          },
          process.env.JWT_REFRESH_SECRET!
        )
      )
      .expect(404);
  });

  it("Must get an error because the user hasn't logged in", async () => {
    const savedUser = await new User({
      email: "authroutetest2@gmail.com",
      name: "Test User",
      phone_number: "123456789",
      password: "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
    }).save();
    await request(app)
      .post("/refresh")
      .set(
        "Refresh-Token",
        jwt.sign(
          {
            email: savedUser.email,
          },
          process.env.JWT_REFRESH_SECRET!
        )
      )
      .expect(401);
  });

  it("Must get an error because the refresh token isn't the one saved in the database", async () => {
    await request(app)
      .post("/refresh")
      .set(
        "Refresh-Token",
        jwt.sign(
          {
            email: testUser.email,
          },
          process.env.JWT_REFRESH_SECRET!
        )
      )
      .expect(401);
  });

  it("Must get an error because the token isn't included", async () => {
    await request(app).post("/refresh").expect(500);
  });
});

describe("POST /logout", () => {
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

  it("Must logout correctly", async () => {
    await request(app)
      .post("/logout")
      .set("Refresh-Token", refreshToken)
      .send()
      .expect(200);
  });

  it("Must get an error because the token isn't verified", async () => {
    await request(app)
      .post("/logout")
      .set(
        "Refresh-Token",
        jwt.sign(
          {
            email: "authroutetest@gmail.com",
          },
          "WRONG_JWT_SECRET"
        )
      )
      .send()
      .expect(401);
  });

  it("Must get an error because the user doesn't exist", async () => {
    await request(app)
      .post("/logout")
      .set(
        "Refresh-Token",
        jwt.sign(
          {
            email: "falseuser@gmail.com",
          },
          process.env.JWT_REFRESH_SECRET!
        )
      )
      .expect(404);
  });

  it("Must get an error because the user hasn't logged in", async () => {
    const savedUser = await new User({
      email: "authroutetest2@gmail.com",
      name: "Test User",
      phone_number: "123456789",
      password: "$2a$10$gTCrwgLHVDOkbNRYzuFeFO3W3WLBOTkk9qoD6PyZgI44aOLrR38dC",
    }).save();
    await request(app)
      .post("/logout")
      .set(
        "Refresh-Token",
        jwt.sign(
          {
            email: savedUser.email,
          },
          process.env.JWT_REFRESH_SECRET!
        )
      )
      .expect(401);
  });

  it("Must get an error because the refresh token isn't the one saved in the database", async () => {
    await request(app)
      .post("/refresh")
      .set(
        "Refresh-Token",
        jwt.sign(
          {
            email: testUser.email,
          },
          process.env.JWT_REFRESH_SECRET!
        )
      )
      .expect(401);
  });

  it("Must get an error because the token isn't included", async () => {
    await request(app).post("/refresh").expect(500);
  });
});
