import * as express from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/user.js";
import { Auth } from "../models/auth.js";

export const userRouter = express.Router();

userRouter.get("/users", async (req, res) => {
  try {
    // Checks if user exists
    const user = await User.findOne({
      email: res.locals.user_email,
    });
    if (!user) {
      return res.status(404).send("Usuario no encontrado");
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
  try {
    // Checks if update is allowed
    const allowedUpdates = ["email", "name", "phone_number", "password"];
    const actualUpdates = Object.keys(req.body);
    const isValidUpdate = actualUpdates.every((update) =>
      allowedUpdates.includes(update)
    );
    if (!isValidUpdate) {
      return res.status(400).send({
        error: "Actualización prohibida",
      });
    }
    // Checks if the user exists
    const userToUpdate = await User.findOne({
      email: res.locals.user_email,
    });
    if (!userToUpdate) {
      return res.status(404).send("Usuario no encontrado");
    }
    // Checks if the new email is in use
    if (req.body.email) {
      if (req.body.email != res.locals.user_email) {
        const updatedEmailUser = await User.findOne({
          email: req.body.email,
        });
        if (updatedEmailUser) {
          return res
            .status(409)
            .send(
              "Ya existe un usuario registrado con este correo electrónico"
            );
        }
      }
    }
    const updatedUser = await userToUpdate.updateOne(
      {
        ...req.body,
      },
      {
        new: true,
        runValidators: true,
      }
    );
    //Updates the users authorization
    const data = {
      email: updatedUser.email,
    };
    const refresh_token = await jwt.sign(
      data,
      process.env.JWT_REFRESH_SECRET!,
      {
        expiresIn: "48h",
      }
    );
    const access_token = await jwt.sign(data, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: "15m",
    });
    await Auth.findByIdAndUpdate(
      updatedUser._id,
      {
        refresh_token: refresh_token,
        access_token: access_token,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    // Sends a new JWT with the updated data
    return res.status(200).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

userRouter.delete("/users", async (req, res) => {
  try {
    // Checks if the user exists
    const userToDelete = await User.findOne({
      email: res.locals.user_email,
    });
    if (!userToDelete) {
      return res.status(404).send("Usuario no encontrado");
    }
    // Deletes the user triggering the schema post middleware
    await User.findByIdAndDelete(userToDelete._id);
    return res.status(200).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});
