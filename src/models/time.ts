import { Document, Schema, model } from "mongoose";
import { UserDocumentInterface } from "./user.js";
import { CheckpointDocumentInterface } from "./checkpoint.js";
import { CourseDocumentInterface } from "./course.js";

export interface CheckpointTimeDocumentInterface extends Document {
  user: UserDocumentInterface;
  course: CourseDocumentInterface;
  checkpoint: CheckpointDocumentInterface;
  time: Date;
}

const CheckpointTimeSchema = new Schema<CheckpointTimeDocumentInterface>({
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

export const CheckpointTime = model<CheckpointTimeDocumentInterface>(
  "CheckpointTime",
  CheckpointTimeSchema
);
