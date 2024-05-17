import * as express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { Course } from "../models/course.js";
import { Checkpoint } from "../models/checkpoint.js";
import { User } from "../models/user.js";
export const courseRouter = express.Router();

// Adds a course
courseRouter.post("/courses", async (req, res) => {
  const jwtSecretKey = process.env.DIY_JWT_SECRET;
  const token = req.headers["auth-token"];

  try {
    const verified = jwt.verify(token!.toString(), jwtSecretKey!);

    if (verified) {
      // Checks if the course already exists
      const courseToCreate = await Course.findOne({
        name: req.body.name,
      });
      if (courseToCreate) {
        return res.status(409).send("Course already exists");
      }
      const admin = await User.findOne({
        email: (<any>verified).email,
      });
      if (!admin) {
        return res.status(404).send("Course admin not found");
      }
      const course = new Course({
        name: req.body.name,
        admin: admin._id,
        checkpoints: [],
      });
      await course.save();

      for (let index = 0; index < req.body.checkpoints.length; index++) {
        const checkpoint = new Checkpoint({
          course: course._id,
          number: req.body.checkpoints[index].number,
          lat: req.body.checkpoints[index].lat,
          lng: req.body.checkpoints[index].lng,
          qr_code: await bcrypt.hash(
            course.name + "&" + req.body.checkpoints[index].number,
            10
          ),
        });
        await checkpoint.save();

        await course.updateOne(
          {
            $addToSet: {
              checkpoints: checkpoint._id,
            },
          },
          {
            new: true,
            runValidators: true,
          }
        );
      }
      return res.status(200).send();
    } else {
      return res.status(401).send("Access denied");
    }
  } catch (error) {
    const deletedCourse = await Course.findOneAndDelete({
      name: req.body.name,
    });
    if (deletedCourse) {
      for (let index = 0; index < deletedCourse.checkpoints.length; index++) {
        await deletedCourse.checkpoints[index].deleteOne();
      }
    }
    return res.status(500).send(error);
  }
});

courseRouter.get("/courses", async (req, res) => {
  const jwtSecretKey = process.env.DIY_JWT_SECRET;
  const token = req.headers["auth-token"];

  try {
    const verified = jwt.verify(token!.toString(), jwtSecretKey!);

    if (verified) {
      const filter = req.query.name ? { name: req.query.name } : {};
      const courses = await Course.find(filter)
        .populate({
          path: "admin",
          select: ["name"],
        })
        .populate({
          path: "checkpoints",
          select: ["number", "lat", "lng", "qr_code"],
        });
      if (courses.length === 0) {
        return res.status(404).send("Courses not found");
      }
      return res.status(200).send(courses);
    } else {
      return res.status(401).send("Access denied");
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
});

// TODO: Updates course by name
courseRouter.patch("/courses", async (req, res) => {
  return res.status(501).send();
});

// Deletes course by name
courseRouter.delete("/courses", async (req, res) => {
  const jwtSecretKey = process.env.DIY_JWT_SECRET;
  const token = req.headers["auth-token"];

  try {
    const verified = jwt.verify(token!.toString(), jwtSecretKey!);

    if (verified) {
      const courseToDelete = await Course.findOne({
        name: req.body.name.toString(),
      });
      if (!courseToDelete) {
        return res.status(404).send("Course not found");
      }

      // Deletes the course
      const deletedCourse = await Course.findOneAndDelete({
        name: req.body.name.toString(),
      });
      // Sends the result to the client
      if (deletedCourse) {
        return res.status(200).send({
          name: deletedCourse.name,
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
