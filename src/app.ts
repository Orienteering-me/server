import express from "express";
import cors from "cors";
import "./db/mongoose.js";
import jwt from "jsonwebtoken";
import { userRouter } from "./routers/user.routes.js";
import { defaultRouter } from "./routers/default.routes.js";
import { courseRouter } from "./routers/course.routes.js";
import { authRouter, deleteAuth } from "./routers/auth.routes.js";
import { User } from "./models/user.js";
import { Auth } from "./models/auth.js";
import { timesRouter } from "./routers/times.routes.js";

const corsOptions = {
  methods: ["GET", "POST", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Access-Token", "Refresh-Token"],
};

export const app = express();
app.use(express.json());
app.use(cors(corsOptions));
app.use(authRouter);
app.use("/users", async (req, res, next) => {
  isAuthorized(req, res, next);
});
app.use(userRouter);
app.use("/courses", async (req, res, next) => {
  isAuthorized(req, res, next);
});
app.use(courseRouter);
app.use("/times", async (req, res, next) => {
  isAuthorized(req, res, next);
});
app.use(timesRouter);
app.use(defaultRouter);

async function isAuthorized(req: any, res: any, next: any) {
  try {
    const jwtSecretKey = process.env.JWT_ACCESS_SECRET;
    const accessToken = req.headers["access-token"];
    // Checks if the access token is correct
    let verified;
    try {
      verified = jwt.verify(accessToken!.toString(), jwtSecretKey!);
    } catch (error) {
      return res.status(401).send("Acceso denegado");
    }
    // Checks if token user exists
    const user = await User.findOne({
      email: (<any>verified).email,
    });
    if (!user) {
      return res.status(401).send("Acceso denegado");
    }
    // Checks if the access token is valid
    const auth = await Auth.findOne({
      user: user._id,
    });
    if (!auth) {
      return res.status(401).send("Acceso denegado");
    }
    if (auth.access_token != accessToken) {
      deleteAuth((<any>verified).email);
      return res.status(401).send("Acceso denegado");
    }
    res.locals.user_email = (<any>verified).email;
    next();
  } catch (error) {
    return res.status(500).send(error);
  }
}
