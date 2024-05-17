import * as express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/user.js";

export const loginRouter = express.Router();

// Login
loginRouter.post("/login", async (req, res) => {
  const jwtSecretKey = process.env.JWT_SECRET;

  try {
    // Checks if user exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).send(`User not found`);
    }
    // Checks if the password is correct
    const isPasswordCorrect = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!isPasswordCorrect) {
      return res.status(401).send(`Invalid password`);
    }
    // Returns the JWT
    const data = {
      domain: "orienteering.me",
      email: user.email,
    };
    const token = jwt.sign(data, jwtSecretKey!, { expiresIn: "48h" });
    return res.status(200).send({ token: token });
  } catch (error) {
    return res.status(500).send(error);
  }
});
