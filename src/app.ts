import express from "express";
import cors from "cors";
import "./db/mongoose.js";
import { userRouter } from "./routers/user.routes.js";
import { defaultRouter } from "./routers/default.routes.js";
import { loginRouter } from "./routers/login.routes.js";
import { courseRouter } from "./routers/course.routes.js";

export const app = express();
app.use(express.json());
app.use(cors());
app.use(userRouter);
app.use(loginRouter);
app.use(courseRouter);
app.use(defaultRouter);
