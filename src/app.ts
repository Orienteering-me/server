import express from "express";
import cors from "cors";
import "./db/mongoose.js";
import { userRouter } from "./routers/user.router.js";

export const app = express();
app.use(express.json());
app.use(cors());
app.use(userRouter);
