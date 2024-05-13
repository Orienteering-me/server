import * as express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "../models/user.js";

export const loginRouter = express.Router();

// Login
loginRouter.post("/login", async (req, res) => {
  const jwtSecretKey = process.env.DIY_JWT_SECRET;

  try {
    // Checks if user exists
    const user = await User.findOne({ email: req.body.email });

    if (user) {
      // Checks if the password is correct
      const isPasswordCorrect = await bcrypt.compare(
        req.body.password,
        user.password
      );
      if (isPasswordCorrect) {
        let data = {
          email: user.email,
        };
        const token = jwt.sign(data, jwtSecretKey!, { expiresIn: "48h" });
        // Returns the JWT
        return res.status(200).send({ token: token });
      } else {
        return res.status(401).send(`Invalid password`);
      }
    } else {
      return res.status(404).send(`User not found`);
    }
  } catch (error) {
    return res.status(500).send(error);
  }
});
