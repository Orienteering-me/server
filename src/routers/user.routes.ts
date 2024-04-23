import * as express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
export const userRouter = express.Router();

// Adds an user
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
      name: user.name,
      phone_number: user.phone_number,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
});

userRouter.get("/users", async (req, res) => {
  const jwtSecretKey = process.env.DIY_JWT_SECRET;
  const token = req.headers["jwt-token"];

  try {
    const verified = jwt.verify(token!.toString(), jwtSecretKey!);
    if (verified) {
      const user = await User.findOne({
        email: (<any>verified).email,
      });
      if (!user) {
        return res.status(404).send("User not found");
      }
      return res.status(200).send({
        email: user.email,
        name: user.name,
        phone_number: user.phone_number,
      });
    } else {
      return res.status(401).send("Access denied");
    }
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Updates user by email
userRouter.patch("/users", async (req, res) => {
  const jwtSecretKey = process.env.DIY_JWT_SECRET;
  const token = req.headers["jwt-token"];

  try {
    const verified = jwt.verify(token!.toString(), jwtSecretKey!);

    if (verified) {
      // Checks if update is allowed
      const allowedUpdates = ["email", "name", "phone_number", "password"];
      const actualUpdates = Object.keys(req.body.update);
      const isValidUpdate = actualUpdates.every((update) =>
        allowedUpdates.includes(update)
      );
      if (!isValidUpdate) {
        return res.status(400).send({
          error: "Forbidden update",
        });
      }

      // Updates the user
      const userToUpdate = await User.findOne({
        email: (<any>verified).email,
      });
      if (!userToUpdate) {
        return res.status(404).send("User not found");
      }

      const updatedUser = await User.findOneAndUpdate(
        { email: req.query.email },
        {
          ...req.body.update,
        },
        {
          new: true,
          runValidators: true,
        }
      );

      // Sends the result to the client
      if (updatedUser) {
        return res.status(200).send({
          email: updatedUser.email,
          name: updatedUser.name,
          phone_number: updatedUser.phone_number,
        });
      }
      return res.status(500).send("An error has ocurred");
    } else {
      return res.status(401).send("Access denied");
    }
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Deletes user by email
userRouter.delete("/users", async (req, res) => {
  const jwtSecretKey = process.env.DIY_JWT_SECRET;
  const token = req.headers["jwt-token"];

  try {
    const verified = jwt.verify(token!.toString(), jwtSecretKey!);

    if (verified) {
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
      if (deletedUser) {
        return res.status(200).send({
          email: deletedUser.email,
        });
      }
      return res.status(500).send("An error has ocurred");
    } else {
      return res.status(401).send("Access denied");
    }
  } catch (error) {
    return res.status(500).send(error);
  }
});
