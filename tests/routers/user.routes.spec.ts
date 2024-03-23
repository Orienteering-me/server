import request from "supertest";
import { expect } from "chai";
import { app } from "../../src/app.js";
import { User } from "../../src/models/user.js";

const testUser = {
  email: "testuser1@gmail.com",
  name: "Test User",
  phone_number: "123456789",
  password: "Testuser123",
};

beforeEach(async () => {
  await User.deleteMany();
  await new User(testUser).save();
});

describe("POST /users", () => {
  it("Must create a new user", async () => {
    const response = await request(app)
      .post("/users")
      .send({
        email: "testuser3@gmail.com",
        name: "New Test User",
        phone_number: "323456789",
        password: "Testuser123",
      })
      .expect(201);

    expect(response.body).to.include({
      email: "testuser3@gmail.com",
      name: "New Test User",
      phone_number: "323456789",
    });
    expect(response.body).to.not.include({
      password: "Testuser123",
    });

    const NewTestUser = await User.findOne({
      email: response.body.email,
    });
    expect(NewTestUser!.email).to.equal("testuser3@gmail.com");
  });

  it("Must get an error because the user already exists", async () => {
    await request(app).post("/users").send(testUser).expect(500);
  });
});

describe("PATCH /users", () => {
  it("Must update a user by his email", async () => {
    const response = await request(app)
      .patch("/users?email=testuser1@gmail.com")
      .send({
        new_user: {
          email: "testuser3@gmail.com",
          name: "New Test User",
          phone_number: "323456789",
          password: "Testuser123",
        },
        current_password: "Testuser123",
      })
      .expect(200);

    expect(response.body).to.include({
      email: "testuser3@gmail.com",
      name: "New Test User",
      phone_number: "323456789",
    });
    expect(response.body).to.not.include({
      password: "Testuser123",
    });

    const UpdatedUser = await User.findOne({
      email: response.body.email,
    });
    expect(UpdatedUser!.email).to.equal("testuser3@gmail.com");
  });

  it("Must get an error because the query doesn't include the email", async () => {
    await request(app)
      .patch("/users")
      .send({
        new_user: {
          email: "testuser3@gmail.com",
          name: "New Test User",
          phone_number: "323456789",
          password: "Testuser123",
        },
        current_password: "Testuser123",
      })
      .expect(400);
  });

  it("Must get an error because the password is wrong", async () => {
    await request(app)
      .patch("/users?email=testuser1@gmail.com")
      .send({
        new_user: {
          email: "testuser3@gmail.com",
          name: "New Test User",
          phone_number: "323456789",
          password: "Testuser123",
        },
        current_password: "Testuser",
      })
      .expect(400);
  });

  it("Must get an error because the update is forbidden is wrong", async () => {
    await request(app)
      .patch("/users?email=testuser1@gmail.com")
      .send({
        new_user: {
          email: "testuser3@gmail.com",
          name: "New Test User",
          phone_number: "323456789",
          password: "Testuser123",
          age: 22,
        },
        current_password: "Testuser123",
      })
      .expect(400);
  });

  it("Must get an error because the user wasn't found", async () => {
    await request(app)
      .patch("/users?email=testuser5@gmail.com")
      .send({
        new_user: {
          email: "testuser3@gmail.com",
          name: "New Test User",
          phone_number: "323456789",
          password: "Testuser123",
        },
        current_password: "Testuser123",
      })
      .expect(404);
  });

  it("Must get an error because the body is malformed", async () => {
    await request(app)
      .patch("/users?email=testuser1@gmail.com")
      .send({
        email: "testuser5",
        name: "New Test User",
        phone_number: "323456789",
        password: "Testuser123",
      })
      .expect(500);
  });
});

describe("DELETE /users", () => {
  it("Must delete a user by his email", async () => {
    const response = await request(app)
      .delete("/users?email=testuser1@gmail.com")
      .send({
        password: "Testuser123",
      })
      .expect(200);

    expect(response.body).to.include({
      email: "testuser1@gmail.com",
    });
    expect(response.body).to.not.include({
      password: "Testuser123",
    });

    const DeletedUser = await User.findOne({
      email: response.body.email,
    });
    expect(DeletedUser).to.be.null;
  });

  it("Must get an error because the query doesn't include the email", async () => {
    await request(app).delete("/users").expect(400);
  });

  it("Must get an error because the request is malformed", async () => {
    await request(app).delete("/users?email=testuser1@gmail.com").expect(400);

    const DeletedUser = await User.findOne({
      email: "testuser1@gmail.com",
    });
    expect(DeletedUser).not.to.be.null;
  });

  it("Must get an error because the user wasn't found", async () => {
    await request(app).delete("/users?email=testuser5@gmail.com").expect(404);
  });

  it("Must get an error because the body is malformed", async () => {
    await request(app).patch("/users?email=testuser1@gmail.com").expect(500);
  });
});
