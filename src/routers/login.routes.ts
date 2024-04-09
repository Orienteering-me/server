import * as express from "express";
import jwt from "jsonwebtoken";
import { User, UserDocumentInterface } from "../models/user.js";

export const loginRouter = express.Router();

// Login
loginRouter.post("/login", async (req, res) => {
  const jwtSecretKey = process.env.DIY_JWT_SECRET;

  try {
    // Checks if user exists
    const user = await User.findOne({ email: req.body.email });

    // Sends the result to the client
    if (user) {
      if (req.body.password == user.password) {
        let data = {
          signInTime: Date.now(),
          email: user.email,
        };

        const token = jwt.sign(data, jwtSecretKey!);
        return res.status(200).send({ token: token });
      }
      return res.status(401).send(`Invalid password`);
    }
    return res.status(404).send(`User not found`);
  } catch (error) {
    return res.status(500).send(error);
  }
});
