import express from "express";

export const defaultRouter = express.Router();

// Sends an status code 501 by default
defaultRouter.all("*", (_, res) => {
  res.status(501).send();
});
