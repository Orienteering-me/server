import * as express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
export const userRouter = express.Router();

userRouter.post("/users", async (req, res) => {
  try {
    const user = new User({
      ...req.body,
    });
    // Checks if the user already exists
    const userToCreate = await User.findOne({
      email: user.email,
    });
    if (userToCreate) {
      return res.status(409).send("User already exists.");
    }
    // Adds the user to the database
    await user.save();
    return res.status(201).send({
      email: user.email,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
});

userRouter.get("/users", async (req, res) => {
  const jwtSecretKey = process.env.JWT_SECRET;
  const token = req.headers["auth-token"];

  try {
    // Checks if the token is correct
    let verified;
    try {
      verified = jwt.verify(token!.toString(), jwtSecretKey!);
    } catch (error) {
      return res.status(401).send("Access denied");
    }
    // Checks if user exists
    const user = await User.findOne({
      email: (<any>verified).email,
    });
    if (!user) {
      return res.status(404).send("User not found");
    }
    // Sends the user data
    return res.status(200).send({
      email: user.email,
      name: user.name,
      phone_number: user.phone_number,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
});

userRouter.patch("/users", async (req, res) => {
  const jwtSecretKey = process.env.JWT_SECRET;
  const token = req.headers["auth-token"];

  try {
    // Checks if the token is correct
    let verified;
    try {
      verified = jwt.verify(token!.toString(), jwtSecretKey!);
    } catch (error) {
      return res.status(401).send("Access denied");
    }
    // Checks if update is allowed
    const allowedUpdates = ["email", "name", "phone_number", "password"];
    const actualUpdates = Object.keys(req.body);
    const isValidUpdate = actualUpdates.every((update) =>
      allowedUpdates.includes(update)
    );
    if (!isValidUpdate) {
      return res.status(400).send({
        error: "Forbidden update",
      });
    }
    // Checks if the user exists
    const userToUpdate = await User.findOne({
      email: (<any>verified).email,
    });
    if (!userToUpdate) {
      return res.status(404).send("User not found");
    }
    // Checks if the new email is in use
    if (req.body.email) {
      if (req.body.email != (<any>verified).email) {
        const updatedEmailUser = await User.findOne({
          email: req.body.email,
        });
        if (updatedEmailUser) {
          return res.status(409).send("User already exists.");
        }
      }
    }
    const updatedUser = await User.findOneAndUpdate(
      { email: (<any>verified).email },
      {
        ...req.body,
      },
      {
        new: true,
        runValidators: true,
      }
    );
    // Sends a new JWT with the updated data
    const data = {
      domain: "orienteering.me",
      email: updatedUser!.email,
    };
    const responseToken = jwt.sign(data, jwtSecretKey!, { expiresIn: "48h" });
    // Returns the JWT
    return res.status(200).send({ token: responseToken });
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Deletes user by email
userRouter.delete("/users", async (req, res) => {
  const jwtSecretKey = process.env.JWT_SECRET;
  const token = req.headers["auth-token"];

  try {
    // Checks if the token is correct
    let verified;
    try {
      verified = jwt.verify(token!.toString(), jwtSecretKey!);
    } catch (error) {
      return res.status(401).send("Access denied");
    }
    const userToDelete = await User.findOne({
      email: (<any>verified).email,
    });
    if (!userToDelete) {
      return res.status(404).send("User not found");
    }

    // Deletes the user
    const deletedUser = await User.findOneAndDelete({
      email: (<any>verified).email,
    });
    // Sends the result to the client
    return res.status(200).send({
      email: deletedUser!.email,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
});
