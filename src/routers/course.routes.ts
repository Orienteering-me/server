import * as express from "express";
import bcrypt from "bcryptjs";
import { Course } from "../models/course.js";
import { Checkpoint } from "../models/checkpoint.js";
import { User } from "../models/user.js";

export const courseRouter = express.Router();

courseRouter.post("/courses", async (req, res) => {
  try {
    // Checks if the user already exists
    const courseToCreate = await Course.findOne({
      name: req.body.name,
    });
    if (courseToCreate) {
      return res.status(409).send("Course already exists");
    }
    // Checks if the admin exists
    const admin = await User.findOne({
      email: res.locals.user_email,
    });
    if (!admin) {
      return res.status(404).send("Course admin not found");
    }
    // Saves the course
    const course = new Course({
      name: req.body.name,
      admin: admin._id,
      checkpoints: [],
    });
    await course.save();
    // Saves the checkpoints
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
    return res.status(201).send();
  } catch (error) {
    // If error deletes the course and the cehckpoints created
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
  try {
    if (req.query.name) {
      let course;
      course = await Course.findOne({ name: req.query.name }).populate({
        path: "admin",
        select: ["email"],
      });
      if (!course) {
        return res.status(404).send("Course not found");
      }
      if (res.locals.user_email == course.admin.email) {
        course = await Course.findById(course._id)
          .populate({
            path: "admin",
            select: ["email", "name"],
          })
          .populate({
            path: "checkpoints",
            select: ["number", "lat", "lng", "qr_code"],
          });
      } else {
        course = await Course.findById(course._id)
          .populate({
            path: "admin",
            select: ["name"],
          })
          .populate({
            path: "checkpoints",
            select: ["number", "lat", "lng"],
          });
      }
      return res.status(200).send({
        is_admin: res.locals.user_email == course!.admin.email,
        course: course,
      });
    } else {
      const courses = await Course.find()
        .populate({
          path: "admin",
          select: ["name"],
        })
        .populate({
          path: "checkpoints",
          select: ["number", "lat", "lng"],
        });
      if (courses.length == 0) {
        return res.status(404).send("Courses not found");
      }
      return res.status(200).send(courses);
    }
  } catch (error) {
    return res.status(500).send(error);
  }
});

// TODO: Updates course by name
courseRouter.patch("/courses", async (req, res) => {
  return res.status(501).send();
});

courseRouter.delete("/courses", async (req, res) => {
  try {
    // Checks if the query is correct
    if (!req.query.name) {
      return res.status(400).send({
        error: "The query must have a name",
      });
    }
    const courseToDelete = await Course.findOne({
      name: req.query.name.toString(),
    }).populate({
      path: "admin",
      select: ["email"],
    });
    // Checks if the course exists
    if (!courseToDelete) {
      return res.status(404).send("Course not found");
    }
    // Checks if the user in the token is the admin
    if (res.locals.user_email != courseToDelete.admin.email) {
      return res.status(401).send("Access denied");
    }
    // Deletes the course triggering the schema post middleware
    await Course.findByIdAndDelete(courseToDelete._id);
    return res.status(200).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});
