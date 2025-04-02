const request = require("supertest");
const mongoose = require("mongoose");
const { app, server } = require("../../app.js");
const User = require("../users/User.model.js");

describe("Auth Controller Tests", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect("mongodb://localhost:27017/test_db", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
    }
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.disconnect();
    server.close();
  });

  test("It must register a new user correctly", async () => {
    const newUser = {
      username: "testuser",
      email: "test@example.com",
      password: "TestPassword@123",
      confirmPassword: "TestPassword@123",
      urls: [],
      isAdmin: false,
      plan: "free",
    };

    const res = await request(app).post("/api/signup").send(newUser);

    expect(res.status).toBe(201);
    expect(res.body.message).toBe(
      "User successfully registered. A confirmation email has been sent."
    );
    expect(res.body.user).toHaveProperty("_id");
    expect(res.body.user.email).toBe(newUser.email);
  }, 10000);

  test("It must reject a registration if the email is already in use.", async () => {
    const existingUser = {
      username: "duplicateuser",
      email: "test@example.com",
      password: "TestPasswor@d123",
      confirmPassword: "TestPasswor@d123",
      urls: [],
      isAdmin: false,
      plan: "free",
    };

    const res = await request(app).post("/api/signup").send(existingUser);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("This email is already registered.");
  });

  test("It must reject a registration if the passwords do not match.", async () => {
    const invalidUser = {
      username: "invaliduser",
      email: "invalid@example.com",
      password: "TestPassword@123",
      confirmPassword: "WrongPassword@",
      urls: [],
      isAdmin: false,
      plan: "free",
    };

    const res = await request(app).post("/api/signup").send(invalidUser);

    expect(res.status).toBe(400);
    expect(res.body.error).toContain("Passwords do not match");
  });

  test("It must register a user with a valid password.", async () => {
    const validUser = {
      username: "newuser",
      email: "newuser@example.com",
      password: "TestPassword@123",
      confirmPassword: "TestPassword@123",
      urls: [],
      isAdmin: false,
      plan: "free",
    };

    const res = await request(app).post("/api/signup").send(validUser);
    expect(res.status).toBe(201);
    expect(res.body.message).toBe(
      "User successfully registered. A confirmation email has been sent."
    );
  });

  test("It must reject a registration with an invalid password (without a special character).", async () => {
    const invalidUser = {
      username: "newuser",
      email: "newuser@example.com",
      password: "TestPassword123",
    };

    const res = await request(app).post("/api/signup").send(invalidUser);
    expect(res.status).toBe(400);
    expect(res.body.error).toBe(
      "The password must be at least 5 characters long, include an uppercase letter, a number, and a special symbol"
    );
  });
});
