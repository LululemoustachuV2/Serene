import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

@Schema()
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email!: string;

  @Prop({ required: true })
  passwordHash!: string;
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);

@Schema({ timestamps: true })
export class MeditationSession {
  @Prop({ required: true, index: true })
  userId!: string;

  @Prop({ required: true })
  startTime!: Date;

  @Prop({ required: true })
  endTime!: Date;

  @Prop({ required: true })
  duration!: number;

  @Prop({ default: true })
  completed!: boolean;

  @Prop({ required: true })
  sound!: string;
}

export type SessionDocument = HydratedDocument<MeditationSession>;
export const SessionSchema = SchemaFactory.createForClass(MeditationSession);
