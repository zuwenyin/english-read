import apiClient from "./apiClient";
import type { StatsOverview, RecentProgress } from "../types";

/** 获取学习统计概览 */
export async function getStatsOverview(): Promise<StatsOverview> {
  return apiClient.get("/api/stats/overview");
}

/** 获取最近学习记录 */
export async function getRecentProgress(): Promise<RecentProgress> {
  return apiClient.get("/api/stats/recent");
}
