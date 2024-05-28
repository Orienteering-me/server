import * as express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Auth } from "../models/auth.js";
import { User } from "../models/user.js";

export const authRouter = express.Router();

authRouter.post("/register", async (req, res) => {
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
    return res.status(201).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

authRouter.post("/login", async (req, res) => {
  try {
    // Checks if user exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).send("User not found");
    }
    // Checks if the password is correct
    const isPasswordCorrect = await bcrypt.compare(
      req.body.password,
      user.password
    );
    if (!isPasswordCorrect) {
      return res.status(401).send("Invalid password");
    }
    // Checks if there is an active session
    const auth = await Auth.findOne({
      user: user._id,
    });
    if (auth) {
      deleteAuth(req.body.email);
    }
    // Returns the JWT
    const data = {
      email: user.email,
    };
    const refreshToken = await jwt.sign(data, process.env.JWT_REFRESH_SECRET!, {
      expiresIn: "24h",
    });
    const accessToken = await jwt.sign(data, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: "15m",
    });
    await new Auth({
      user: user._id,
      refresh_token: refreshToken,
      access_token: accessToken,
    }).save();
    return res
      .status(200)
      .send({ refresh_token: refreshToken, access_token: accessToken });
  } catch (error) {
    return res.status(500).send(error);
  }
});

authRouter.post("/refresh", async (req, res) => {
  const jwtSecretKey = process.env.JWT_REFRESH_SECRET;
  const refreshToken = req.headers["refresh-token"];

  try {
    // Checks if the refresh token is correct
    let verified;
    try {
      verified = jwt.verify(refreshToken!.toString(), jwtSecretKey!);
    } catch (error) {
      const decoded = jwt.decode(refreshToken!.toString());
      deleteAuth((<any>decoded).email);
      return res.status(401).send("Access denied");
    }
    // Checks if token user exists
    const user = await User.findOne({
      email: (<any>verified).email,
    });
    if (!user) {
      return res.status(401).send("Access denied");
    }
    // Checks if the refresh token is valid
    const auth = await Auth.findOne({
      user: user._id,
    });
    if (!auth) {
      return res.status(401).send("Access denied");
    }
    if (auth.refresh_token != refreshToken) {
      deleteAuth((<any>verified).email);
      return res.status(401).send("Access denied");
    }
    // Deletes and sends the new pair of tokens
    deleteAuth((<any>verified).email);
    const data = {
      email: user.email,
    };
    const newRefreshToken = await jwt.sign(
      data,
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: "48h" }
    );
    const newAccessToken = await jwt.sign(
      data,
      process.env.JWT_ACCESS_SECRET!,
      {
        expiresIn: "15m",
      }
    );
    await new Auth({
      user: user._id,
      refresh_token: newRefreshToken,
      access_token: newAccessToken,
    }).save();
    return res
      .status(200)
      .send({ refresh_token: newRefreshToken, access_token: newAccessToken });
  } catch (error) {
    return res.status(401).send(error);
  }
});

authRouter.post("/logout", async (req, res) => {
  const jwtSecretKey = process.env.JWT_REFRESH_SECRET;
  const refreshToken = req.headers["refresh-token"];

  try {
    // Checks if the refresh token is correct
    let verified;
    try {
      verified = jwt.verify(refreshToken!.toString(), jwtSecretKey!);
    } catch (error) {
      const decoded = jwt.decode(refreshToken!.toString());
      deleteAuth((<any>decoded).email);
      return res.status(401).send("Access denied");
    }
    // Checks if token user exists
    const user = await User.findOne({
      email: (<any>verified).email,
    });
    if (!user) {
      return res.status(404).send("User not found");
    }
    // Checks if the refresh token is valid
    const auth = await Auth.findOne({
      user: user._id,
    });
    if (auth!.refresh_token != refreshToken) {
      deleteAuth((<any>verified).email);
      return res.status(401).send("Access denied");
    }
    deleteAuth((<any>verified).email);
    return res.status(200).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

// Deletes an entry in the auth collection
async function deleteAuth(email: string) {
  const user = await User.findOne({
    email: email,
  });
  if (user) {
    await Auth.findOneAndDelete({
      user: user,
    });
  }
}
