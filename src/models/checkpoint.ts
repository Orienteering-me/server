import { Document, Schema, model } from "mongoose";
import { CourseDocumentInterface } from "./course.js";

export interface CheckpointDocumentInterface extends Document {
  course: CourseDocumentInterface;
  number: number;
  lat: number;
  lng: number;
  qr_code: string;
}

const CheckpointSchema = new Schema<CheckpointDocumentInterface>({
  course: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Course",
  },
  number: {
    type: Number,
    required: true,
    validate: (value: number) => {
      if (value < 0 || value % 1 !== 0) {
        throw new Error(
          "El número del punto de control debe ser un entero mayor o igual a 0"
        );
      }
    },
  },
  lat: {
    type: Number,
    required: true,
    validate: (value: number) => {
      if (value < -90 || value > 90) {
        throw new Error(
          "La latitud de un punto de control debe estar entre -90 y 90 grados"
        );
      }
    },
  },
  lng: {
    type: Number,
    required: true,
    validate: (value: number) => {
      if (value < -180 || value > 180) {
        throw new Error(
          "La longitud de un punto de control debe estar entre -180 y 180 grados"
        );
      }
    },
  },
  qr_code: {
    type: String,
    unique: true,
    required: true,
    trim: true,
  },
});

export const Checkpoint = model<CheckpointDocumentInterface>(
  "Checkpoint",
  CheckpointSchema
);
