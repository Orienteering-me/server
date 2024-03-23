import * as express from "express";
import { User, UserDocumentInterface } from "../models/user.js";

export const loginRouter = express.Router();

// Login
loginRouter.post("/login", async (req, res) => {
  try {
    // Checks if user exists
    const user = await User.findOne({ email: req.body.email });

    // Sends the result to the client
    if (user) {
      if (req.body.password == user.password) {
        return res.status(200).send({
          email: user.email,
          name: user.name,
          phone_number: user.phone_number,
        });
      }
      return res.status(400).send(`Wrong password`);
    }
    return res.status(404).send(`User not found`);
  } catch (error) {
    return res.status(500).send(error);
  }
});
