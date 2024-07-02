import * as express from "express";
import bcrypt from "bcryptjs";
import { Course } from "../models/course.js";
import { Checkpoint } from "../models/checkpoint.js";
import { User } from "../models/user.js";
import { CheckpointTime } from "../models/time.js";

export const courseRouter = express.Router();

courseRouter.post("/courses", async (req, res) => {
  let courseSaved = false;
  try {
    // Checks if the course already exists
    const courseToCreate = await Course.findOne({
      name: req.body.name,
    });
    if (courseToCreate) {
      return res.status(409).send("Ya existe una carrera con este nombre");
    }
    // Checks if the admin exists
    const admin = await User.findOne({
      email: res.locals.user_email,
    });
    if (!admin) {
      return res.status(404).send("Administrador de la carrera no encontrado");
    }
    // Saves the course
    const course = new Course({
      name: req.body.name,
      admin: admin._id,
      checkpoints: [],
    });
    await course.save();
    courseSaved = true;
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
    // If error deletes the course created
    if (courseSaved) {
      await Course.findOneAndDelete({
        name: req.body.name,
      });
    }
    return res.status(500).send(error);
  }
});

courseRouter.get("/courses", async (req, res) => {
  try {
    // If the query includes the courses's name sends the course requested
    // Else sends all the courses saved
    if (req.query.name) {
      // Checks if the course exists
      let course;
      course = await Course.findOne({ name: req.query.name }).populate({
        path: "admin",
        select: ["email", "name"],
      });
      if (!course) {
        return res.status(404).send("Carrera no encontrada");
      }
      const isAdmin = res.locals.user_email == course.admin.email;
      if (isAdmin) {
        // If the requesting user is admin of the course sends the checkpoints with QR codes
        await course.populate({
          path: "checkpoints",
          select: ["number", "lat", "lng", "qr_code"],
        });
      } else {
        // If the requesting user is admin of the course sends the checkpoints without QR codes
        await course.populate({
          path: "checkpoints",
          select: ["number", "lat", "lng"],
        });
      }
      // Checks if the course has uploaded times
      const uploadedTimes = await CheckpointTime.find({ course: course._id });
      return res.status(200).send({
        course: course,
        is_admin: isAdmin,
        has_uploaded_times: uploadedTimes.length > 0,
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
      // Checks if there are courses saved
      if (courses.length == 0) {
        return res.status(404).send("Carreras no encontradas");
      }
      return res.status(200).send({ courses: courses });
    }
  } catch (error) {
    return res.status(500).send(error);
  }
});

courseRouter.patch("/courses", async (req, res) => {
  try {
    // Checks if update is allowed
    const allowedUpdates = ["name", "checkpoints"];
    const actualUpdates = Object.keys(req.body);
    const isValidUpdate = actualUpdates.every((update) =>
      allowedUpdates.includes(update)
    );
    if (!isValidUpdate) {
      return res.status(400).send({
        error: "Actualización prohibida",
      });
    }
    // Checks if the query is correct
    if (!req.query.name) {
      return res.status(400).send({
        error: "La consulta debe incluir el nombre de la carrera",
      });
    }
    // Checks if the course exists
    const courseToUpdate = await Course.findOne({
      name: req.query.name,
    }).populate({
      path: "admin",
      select: ["email"],
    });
    if (!courseToUpdate) {
      return res.status(404).send("Carrera no encontrada");
    }
    // Checks if the user in the token is the admin
    if (res.locals.user_email != courseToUpdate.admin.email) {
      return res.status(401).send("Acceso denegado");
    }
    // Checks if the new name is in use
    if (req.body.name) {
      if (req.body.name != courseToUpdate.name) {
        const updatedNameCourse = await Course.findOne({
          name: req.body.name,
        });
        if (updatedNameCourse) {
          return res
            .status(409)
            .send("Ya existe una carrera registrada con este nombre");
        }
      }
    }
    const uploadedTimes = await CheckpointTime.find({
      course: courseToUpdate._id,
    });
    if (uploadedTimes.length > 0) {
      return res
        .status(409)
        .send(
          "Esta carrera no se puede modificar porque tiene resultados asociados"
        );
    }
    // Saves the new checkpoints
    const newCheckpoints: string[] = [];
    for (let index = 0; index < req.body.checkpoints.length; index++) {
      const qrCode = await bcrypt.hash(
        courseToUpdate.name + "&" + req.body.checkpoints[index].number,
        10
      );
      const checkpointToSave = await Checkpoint.findOne({ qr_code: qrCode });
      if (checkpointToSave) {
        await checkpointToSave.updateOne({
          lat: req.body.checkpoints[index].lat,
          lng: req.body.checkpoints[index].lng,
        });
        newCheckpoints.push(checkpointToSave._id);
      } else {
        const checkpoint = new Checkpoint({
          course: courseToUpdate._id,
          number: req.body.checkpoints[index].number,
          lat: req.body.checkpoints[index].lat,
          lng: req.body.checkpoints[index].lng,
          qr_code: qrCode,
        });
        const savedCheckpoint = await checkpoint.save();
        newCheckpoints.push(savedCheckpoint._id);
      }
    }
    // Deletes the checkpoints that no longer exist
    const checkpointsToDelete = courseToUpdate.checkpoints.filter(
      (checkpoint) => !newCheckpoints.includes(checkpoint._id)
    );
    for (let index = 0; index < checkpointsToDelete.length; index++) {
      await Checkpoint.findByIdAndDelete(checkpointsToDelete[index]);
    }
    // Updates the course with the new info
    await courseToUpdate.updateOne(
      {
        name: req.body.name,
        checkpoints: newCheckpoints,
      },
      {
        new: true,
        runValidators: true,
      }
    );
    return res.status(200).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});

courseRouter.delete("/courses", async (req, res) => {
  try {
    // Checks if the query is correct
    if (!req.query.name) {
      return res.status(400).send({
        error: "La consulta debe incluir el nombre de la carrera",
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
      return res.status(404).send("Carrera no encontrada");
    }
    // Checks if the user in the token is the admin
    if (res.locals.user_email != courseToDelete.admin.email) {
      return res.status(401).send("Acceso denegado");
    }
    // Deletes the course triggering the schema post middleware
    await Course.findByIdAndDelete(courseToDelete._id);
    return res.status(200).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});
