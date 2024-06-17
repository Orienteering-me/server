import * as express from "express";
import Jimp from "jimp";
import multer from "multer";
import { Course } from "../models/course.js";
import ExifReader from "exifreader";
import { getPreciseDistance } from "geolib";
import { createRequire } from "module";
import { Checkpoint } from "../models/checkpoint.js";
import { Stat } from "../models/stat.js";
import { User } from "../models/user.js";

const require = createRequire(import.meta.url);
const qrCodeReader = require("qrcode-reader");

export const statsRouter = express.Router();

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

statsRouter.post("/stats", upload.single("image"), async (req, res) => {
  try {
    // Checks if the request has a file
    if (!req.file) {
      return res.status(400).send({
        msg: "La petición debe incluir la imagen QR a procesar",
      });
    }
    // Checks if the query has a course field
    if (!req.query.course) {
      return res.status(400).send({
        msg: "La consulta debe incluir el nombre de la carrera",
      });
    }
    // Checks if the course exists
    const course = await Course.findOne({
      name: req.query.course.toString(),
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
    const time = new Date(
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
    const checkpointStat = await Stat.findOne({
      user: user._id,
      checkpoint: checkpoint._id,
    });
    if (checkpointStat != null) {
      if (checkpointStat.time <= time) {
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
      const preCheckpointStat = await Stat.findOne({
        user: user._id,
        checkpoint: preCheckpoint._id,
      });
      if (preCheckpointStat != null) {
        if (preCheckpointStat.time >= time) {
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
      const postCheckpointStat = await Stat.findOne({
        user: user._id,
        checkpoint: postCheckpoint._id,
      });
      if (postCheckpointStat != null) {
        if (postCheckpointStat.time <= time) {
          return res.status(400).send({
            checkpoint: -1,
            msg: "La hora de la foto es inválida",
          });
        }
      }
    }
    // Saves the new stat
    const stat = new Stat({
      user: user._id,
      course: course._id,
      checkpoint: checkpoint,
      time: time,
    });
    await stat.save();
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

statsRouter.get("/stats", async (req, res) => {
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
    });
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
    const stats = [];
    for (let index = 0; index < checkpoints.length; index++) {
      const stat = await Stat.findOne({
        checkpoint: checkpoints[index]._id,
        user: user._id,
      });
      stats.push(stat);
    }
    // Sends the user data
    return res.status(200).send(stats);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
});

statsRouter.get("/results", async (req, res) => {
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
    });
    if (!course) {
      return res.status(404).send({
        msg: "Carrera no encontrada",
      });
    }
    const users = await Stat.find({
      course: course._id,
    })
      .select("user")
      .distinct("user");
    const response = [];
    for (let index = 0; index < users.length; index++) {
      const user = await User.findById(users[index]);
      const stats = await Stat.find({
        course: course._id,
        user: user!._id,
      }).populate({
        path: "checkpoint",
        select: ["number"],
      });
      if (stats.length != course.checkpoints.length) {
        response.push({ course: course.name, user: user!.name, time: -1 });
      } else {
        const startStat = stats.find((stat) => {
          return stat.checkpoint.number == 0;
        });
        const endStat = stats.find((stat) => {
          return stat.checkpoint.number == course.checkpoints.length - 1;
        });
        const time = endStat!.time!.getTime() - startStat!.time!.getTime();
        response.push({ course: course.name, user: user!.name, time: time });
      }
    }
    response.sort((result1, result2) => {
      if (result1 > result2) return 1;
      if (result1 < result2) return -1;
      return 0;
    });
    // Sends the user data
    return res.status(200).send(response);
  } catch (error) {
    console.log(error);
    return res.status(500).send(error);
  }
});

// TODO
statsRouter.delete("/stats", async (req, res) => {
  return res.status(501).send();
});
