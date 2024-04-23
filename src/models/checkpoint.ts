import { Document, Schema, model } from "mongoose";
import { CourseDocumentInterface } from "./course.js";

export interface CheckpointDocumentInterface extends Document {
  course: CourseDocumentInterface;
  number: number;
  coords: [number, number];
  type: "Start" | "Finish" | "Other";
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
      if (value <= 0 || value % 1 !== 0) {
        throw new Error("El ID de la ruta debe ser un entero positivo.");
      }
    },
  },
  coords: {
    type: [Number],
    required: true,
    validate: (value: number[]) => {
      if (value[0] < -90 || value[0] > 90) {
        throw new Error(
          `La latitud de las coordenadas del checkpoint debe estar entre -90 y 90 grados`
        );
      } else if (value[1] < -180 || value[1] > 180) {
        throw new Error(
          "La longitud de las coordenadas del checkpoint debe estar entre -180 y 180 grados"
        );
      }
    },
  },
  type: {
    type: String,
    required: true,
    default: "Other",
    enum: ["Start", "Finish"],
  },
});

export const Checkpoint = model<CheckpointDocumentInterface>(
  "Checkpoint",
  CheckpointSchema
);
