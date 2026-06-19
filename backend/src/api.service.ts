import { Injectable, OnModuleInit, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { MeditationSession, SessionDocument, User, UserDocument } from './schemas';

export interface SessionDto {
  startTime: string;
  endTime: string;
  duration: number;
  completed: boolean;
  sound: string;
}

@Injectable()
export class ApiService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly users: Model<UserDocument>,
    @InjectModel(MeditationSession.name) private readonly sessions: Model<SessionDocument>,
    private readonly jwt: JwtService,
  ) {}

  async onModuleInit(): Promise<void> {
    const email = 'test@serene.app';
    const exists = await this.users.exists({ email });
    if (exists) return;

    const passwordHash = await bcrypt.hash('serene123', 10);
    await this.users.create({ email, passwordHash });
  }

  async login(email: string, password: string) {
    const user = await this.users.findOne({ email: email.toLowerCase().trim() });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Identifiants invalides');
    }

    const payload = { sub: user._id.toString(), email: user.email };
    return {
      accessToken: await this.jwt.signAsync(payload),
      user: { id: user._id.toString(), email: user.email },
    };
  }

  listSessions(userId: string) {
    return this.sessions
      .find({ userId })
      .sort({ startTime: -1 })
      .then((rows) => rows.map((s) => this.toApi(s)));
  }

  async createSession(userId: string, dto: SessionDto) {
    const created = await this.sessions.create({
      userId,
      startTime: new Date(dto.startTime),
      endTime: new Date(dto.endTime),
      duration: dto.duration,
      completed: dto.completed,
      sound: dto.sound,
    });
    return this.toApi(created);
  }

  async deleteSession(userId: string, id: string): Promise<boolean> {
    const result = await this.sessions.deleteOne({ _id: id, userId });
    return result.deletedCount > 0;
  }

  private toApi(session: SessionDocument) {
    return {
      id: session._id.toString(),
      startTime: session.startTime.toISOString(),
      endTime: session.endTime.toISOString(),
      duration: session.duration,
      completed: session.completed,
      sound: session.sound,
    };
  }
}
