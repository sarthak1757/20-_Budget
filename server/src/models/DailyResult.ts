import { Schema, model } from "mongoose";

// One Daily Challenge attempt. The score was worked out by the server
// replaying the moves, never sent by the browser.
export interface DailyResultDoc {
  dateKey: string; // "2026-11-18", UTC
  playerName: string;
  nameKey: string; // lower-case name: one attempt per name per day
  total: number;
  botTotal: number;
  moves: string[]; // kept so a score can be checked again later
  playedAt: Date;
}

const dailyResultSchema = new Schema<DailyResultDoc>({
  dateKey: { type: String, required: true },
  playerName: { type: String, required: true },
  nameKey: { type: String, required: true },
  total: { type: Number, required: true },
  botTotal: { type: Number, required: true },
  moves: { type: [String], required: true },
  playedAt: { type: Date, default: Date.now },
});

dailyResultSchema.index({ dateKey: 1, nameKey: 1 }, { unique: true });
dailyResultSchema.index({ dateKey: 1, total: -1 });

export const DailyResultModel = model<DailyResultDoc>("DailyResult", dailyResultSchema);
