import { IProgressRepository } from "../repositories/interfaces/IProgressRepository";

export class StatsService {
  constructor(private progressRepo: IProgressRepository) {}

  /** 获取学习统计概览 */
  async getStatsOverview(userId: number) {
    return this.progressRepo.getStatsOverview(userId);
  }

  /** 获取最近学习记录 */
  async getRecentProgress(userId: number) {
    return this.progressRepo.getRecentProgress(userId);
  }
}
