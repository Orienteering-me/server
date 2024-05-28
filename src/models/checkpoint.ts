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
        throw new Error("Checkpoints number must be equal or greater than 0");
      }
    },
  },
  lat: {
    type: Number,
    required: true,
    validate: (value: number) => {
      if (value < -90 || value > 90) {
        throw new Error(
          "Checkpoints latitude must be between -90 and 90 degrees"
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
          "Checkpoints longitude must be between -180 and 180 degrees"
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
