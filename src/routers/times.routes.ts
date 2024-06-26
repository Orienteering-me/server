import * as express from "express";
import Jimp from "jimp";
import multer from "multer";
import { Course } from "../models/course.js";
import ExifReader from "exifreader";
import { getPreciseDistance } from "geolib";
import { createRequire } from "module";
import { Checkpoint } from "../models/checkpoint.js";
import { CheckpointTime } from "../models/time.js";
import { User } from "../models/user.js";

const require = createRequire(import.meta.url);
const qrCodeReader = require("qrcode-reader");

export const timesRouter = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
      cb(null, true);
    } else {
      cb(new Error("Formato de archivo inválido"));
    }
  },
});

timesRouter.post("/times", upload.single("image"), async (req, res) => {
  try {
    // Checks if the request has a file
    if (!req.file) {
      return res.status(400).send({
        msg: "La petición debe incluir la imagen QR a procesar",
      });
    }
    // Checks if the course exists
    const course = await Course.findOne({
      name: req.body.course.toString(),
    }).populate({
      path: "checkpoints",
      select: ["number", "lat", "lng", "qr_code"],
    });
    if (!course) {
      return res.status(404).send({
        msg: "Carrera no encontrada",
      });
    }
    // Checks if the course exists
    const user = await User.findOne({
      email: res.locals.user_email,
    });
    if (!user) {
      return res.status(404).send({
        msg: "Usuario no encontrado",
      });
    }
    // Checks if there is a QR code in the image
    const image = await Jimp.read(req.file.buffer);
    let decodedQR: any;
    const qrCodeInstance = new qrCodeReader();
    try {
      qrCodeInstance.callback = function (err: any, value: any) {
        if (err) {
          throw new Error(err);
        }
        decodedQR = value.result;
      };
      qrCodeInstance.decode(image.bitmap);
    } catch (error) {
      return res.status(400).send({
        checkpoint: -1,
        msg: "No se ha detectado ningún QR",
      });
    }
    // Checks if the QR code is valid
    const checkpoint = await Checkpoint.findOne({
      course: course._id,
      qr_code: decodedQR,
    });
    if (!checkpoint) {
      return res.status(400).send({
        checkpoint: -1,
        msg: "Este QR no pertenece a la carrera",
      });
    }
    // Checks if the file location is valid
    const tags = await ExifReader.load(req.file.buffer, { expanded: true });
    if (!tags.gps?.Latitude || !tags.gps?.Longitude) {
      return res.status(400).send({
        checkpoint: -1,
        msg: "No se ha detectado la localización de la imagen",
      });
    }
    if (
      getPreciseDistance(
        { latitude: checkpoint.lat, longitude: checkpoint.lng },
        { latitude: tags.gps?.Latitude, longitude: tags.gps?.Longitude }
      ) > 20
    ) {
      return res.status(400).send({
        checkpoint: -1,
        msg: "La localización de la imagen no coincide con ningún punto de control",
      });
    }
    if (!tags.exif?.DateTime?.value[0]) {
      return res.status(400).send({
        checkpoint: -1,
        msg: "No se ha detectado la hora de creación de la imagen",
      });
    }
    // Checks if the time of the image is valid
    const splitDate = tags.exif.DateTime.value[0].split(/ |:/);
    const imageTime = new Date(
      Date.parse(
        splitDate[0] +
          "-" +
          splitDate[1] +
          "-" +
          splitDate[2] +
          "T" +
          splitDate[3] +
          ":" +
          splitDate[4] +
          ":" +
          splitDate[5] +
          ".000" +
          tags.exif.OffsetTime?.value
      )
    );
    const checkpointTime = await CheckpointTime.findOne({
      user: user._id,
      checkpoint: checkpoint._id,
    });
    if (checkpointTime != null) {
      if (checkpointTime.time <= imageTime) {
        return res.status(409).send({
          checkpoint: -1,
          msg: "Ya hay un imagen subida con un tiempo mejor para este punto de control",
        });
      }
    }
    const preCheckpoint = await Checkpoint.findOne({
      course: course._id,
      number: checkpoint.number - 1,
    });
    if (preCheckpoint != null) {
      const preCheckpointTime = await CheckpointTime.findOne({
        user: user._id,
        checkpoint: preCheckpoint._id,
      });
      if (preCheckpointTime != null) {
        if (preCheckpointTime.time >= imageTime) {
          return res.status(400).send({
            checkpoint: -1,
            msg: "La hora de la foto es inválida",
          });
        }
      }
    }
    const postCheckpoint = await Checkpoint.findOne({
      course: course._id,
      number: checkpoint.number + 1,
    });
    if (postCheckpoint != null) {
      const postCheckpointTime = await CheckpointTime.findOne({
        user: user._id,
        checkpoint: postCheckpoint._id,
      });
      if (postCheckpointTime != null) {
        if (postCheckpointTime.time <= imageTime) {
          return res.status(400).send({
            checkpoint: -1,
            msg: "La hora de la foto es inválida",
          });
        }
      }
    }
    // Saves the new stat
    const time = new CheckpointTime({
      user: user._id,
      course: course._id,
      checkpoint: checkpoint,
      time: imageTime,
    });
    await time.save();
    return res.status(201).send({
      checkpoint: checkpoint.number,
      msg: "QR procesado correctamente",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      checkpoint: -1,
      msg: "Ha ocurrido un error procesando la imagen",
    });
  }
});

timesRouter.get("/times/uploaded", async (req, res) => {
  try {
    // Checks if the query is correct
    if (!req.query.course) {
      return res.status(400).send({
        error: "La consulta debe incluir el nombre de la carrera",
      });
    }
    // Checks if the course exists
    const course = await Course.findOne({
      name: req.query.course.toString(),
    }).populate({ path: "admin", select: "email" });
    if (!course) {
      return res.status(404).send({
        msg: "Carrera no encontrada",
      });
    }
    // Checks if user exists
    const user = await User.findOne({
      email: res.locals.user_email,
    });
    if (!user) {
      return res.status(404).send("Usuario no encontrado");
    }
    // Checks if checkpoints exist
    const checkpoints = await Checkpoint.find({
      course: course._id,
    }).sort("number");
    if (!checkpoints) {
      return res.status(404).send("Puntos de control no encontrados");
    }
    // Gets stats
    const times = [];
    for (let index = 0; index < checkpoints.length; index++) {
      const time = await CheckpointTime.findOne({
        checkpoint: checkpoints[index]._id,
        user: user._id,
      });
      times.push(time);
    }
    // Sends the user data
    return res.status(200).send({
      times: times,
      is_admin: course.admin.email == res.locals.user_email,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
});

timesRouter.get("/times", async (req, res) => {
  try {
    // Checks if the query is correct
    if (!req.query.course) {
      return res.status(400).send({
        error: "La consulta debe incluir el nombre de la carrera",
      });
    }
    // Checks if the course exists
    const course = await Course.findOne({
      name: req.query.course.toString(),
    }).populate({ path: "admin", select: "email" });
    if (!course) {
      return res.status(404).send({
        msg: "Carrera no encontrada",
      });
    }
    const users = await CheckpointTime.find({
      course: course._id,
    })
      .select("user")
      .distinct("user");
    const results = [];
    let hasUploadedStats = false;
    for (let index = 0; index < users.length; index++) {
      const user = await User.findById(users[index]);
      const stats = await CheckpointTime.find({
        course: course._id,
        user: user!._id,
      }).populate({
        path: "checkpoint",
        select: ["number"],
      });
      if (stats.length != course.checkpoints.length) {
        results.push({
          course: course.name,
          user: { email: user!.email, name: user!.name },
          time: Number.MAX_SAFE_INTEGER,
        });
      } else {
        const startTime = stats.find((stat) => {
          return stat.checkpoint.number == 0;
        });
        const endTime = stats.find((stat) => {
          return stat.checkpoint.number == course.checkpoints.length - 1;
        });
        const time = endTime!.time!.getTime() - startTime!.time!.getTime();
        results.push({
          course: course.name,
          user: { email: user!.email, name: user!.name },
          time: time,
        });
        if (user!.email == res.locals.user_email) {
          hasUploadedStats = true;
        }
      }
    }
    results.sort((result1, result2) => {
      if (result1.time > result2.time) return 1;
      if (result1.time < result2.time) return -1;
      return 0;
    });
    // Sends the user data
    return res.status(200).send({
      results: results,
      has_uploaded: hasUploadedStats,
      is_admin: course.admin.email == res.locals.user_email,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
});

// TODO
timesRouter.delete("/times", async (req, res) => {
  try {
    // Checks if the query is correct
    if (!req.query.course || !req.query.email) {
      return res.status(400).send({
        error:
          "La consulta debe incluir el nombre de la carrera y el email del usuario",
      });
    }
    const course = await Course.findOne({
      name: req.query.course.toString(),
    }).populate({
      path: "admin",
      select: ["email"],
    });
    // Checks if the course exists
    if (!course) {
      return res.status(404).send("Carrera no encontrada");
    }
    const user = await User.findOne({
      email: req.query.email.toString(),
    });
    // Checks if the user exists
    if (!user) {
      return res.status(404).send("Usuario no encontrado");
    }
    // Checks if the user in the token is the courses's admin
    if (res.locals.user_email != course.admin.email) {
      return res.status(401).send("Acceso denegado");
    }
    // Deletes the course triggering the schema post middleware
    await CheckpointTime.deleteMany({
      course: course._id,
      user: user._id,
    }).exec();
    return res.status(200).send();
  } catch (error) {
    return res.status(500).send(error);
  }
});
