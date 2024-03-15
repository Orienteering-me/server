import * as express from "express";
import { User, UserDocumentInterface } from "../models/user.js";
export const userRouter = express.Router();

// Adds an user
userRouter.post("/users", async (req, res) => {
  try {
    const user = new User({
      ...req.body,
    });

    // Adds the user to the database
    await user.save();
    return res.status(201).send({
      username: user.username,
      name: user.name,
      email: user.email,
      image_url: user.image_url,
    });
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Updates user by username
userRouter.patch("/users/:username", async (req, res) => {
  try {
    // Checks if update is allowed
    const allowedUpdates = [
      "email",
      "username",
      "name",
      "password",
      "image_url",
    ];
    const actualUpdates = Object.keys(req.body.new_user);
    const isValidUpdate = actualUpdates.every((update) =>
      allowedUpdates.includes(update)
    );
    if (!isValidUpdate) {
      return res.status(400).send({
        error: "Actualización no permitida",
      });
    }

    // Updates the user
    const userToUpdate = await User.findOne({
      username: req.params.username.toString(),
    });
    if (!userToUpdate) {
      return res.status(404).send("Usuario no encontrado");
    }
    if (req.body.current_password != userToUpdate.password) {
      return res.status(400).send("La contraseña es incorrecta");
    }

    const updatedUser = await User.findOneAndUpdate(
      { username: req.params.username },
      {
        ...req.body.new_user,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    // Sends the result to the client
    if (updatedUser) {
      return res.status(200).send({
        username: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email,
        image_url: updatedUser.image_url,
      });
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Deletes user by username
userRouter.delete("/users/:username", async (req, res) => {
  try {
    // Deletes the user
    const deletedUser = await User.findOneAndDelete({
      username: req.params.username.toString(),
    });

    // Sends the result to the client
    if (deletedUser) {
      return res.status(200).send({
        username: deletedUser.username,
        name: deletedUser.name,
        email: deletedUser.email,
        image_url: deletedUser.image_url,
      });
    }
    return res.status(404).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});
