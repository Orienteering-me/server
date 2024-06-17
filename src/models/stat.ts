import { Document, Schema, model } from "mongoose";
import { UserDocumentInterface } from "./user.js";
import { CheckpointDocumentInterface } from "./checkpoint.js";
import { CourseDocumentInterface } from "./course.js";

export interface StatDocumentInterface extends Document {
  user: UserDocumentInterface;
  course: CourseDocumentInterface;
  checkpoint: CheckpointDocumentInterface;
  time: Date;
}

const StatSchema = new Schema<StatDocumentInterface>({
  user: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  course: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Course",
  },
  checkpoint: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "Checkpoint",
  },
  time: {
    type: Date,
    required: true,
  },
});

export const Stat = model<StatDocumentInterface>("Stat", StatSchema);
