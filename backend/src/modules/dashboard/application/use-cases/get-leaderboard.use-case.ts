import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import { LeaderboardRowDto } from '../dtos/leaderboard-row.dto';
import {
  ACTIVITY_REPOSITORY,
  IActivityRepository,
} from '../../../activities/domain/repositories/activity.repository.interface';
import { SellerTypeormEntity } from '../../../sellers/infrastructure/entities/seller.typeorm.entity';
import { GetSettingsUseCase } from '../../../settings/application/use-cases/get-settings.use-case';

@Injectable()
export class GetLeaderboardUseCase implements IUseCase<void, LeaderboardRowDto[]> {
  constructor(
    @Inject(ACTIVITY_REPOSITORY)
    private readonly activityRepo: IActivityRepository,
    @InjectRepository(SellerTypeormEntity)
    private readonly sellerRepo: Repository<SellerTypeormEntity>,
    private readonly getSettings: GetSettingsUseCase,
  ) {}

  async execute(): Promise<LeaderboardRowDto[]> {
    const settings = await this.getSettings.execute();
    const dailyMinPoints = settings.dailyMinPoints;

    const sellers = await this.sellerRepo.find({
      where: { active: true, deletedAt: IsNull() },
    });

    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    // Range covers the previous month start through the end of today (exclusive tomorrow).
    const from = previousMonthStart;
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const rows = await this.activityRepo.sumPointsByDayForSellers(from, to);

    // sellerId -> (dayStr -> points)
    const pointsBySeller = new Map<string, Map<string, number>>();
    for (const row of rows) {
      let days = pointsBySeller.get(row.sellerId);
      if (!days) {
        days = new Map<string, number>();
        pointsBySeller.set(row.sellerId, days);
      }
      days.set(row.day, (days.get(row.day) ?? 0) + row.points);
    }

    const currentMonthPrefix = this.monthPrefix(currentMonthStart);
    const previousMonthPrefix = this.monthPrefix(previousMonthStart);

    const computed: LeaderboardRowDto[] = sellers.map((seller) => {
      const days = pointsBySeller.get(seller.id) ?? new Map<string, number>();

      let monthlyPoints = 0;
      let previousMonthPoints = 0;
      for (const [day, points] of days) {
        if (day.startsWith(currentMonthPrefix)) monthlyPoints += points;
        else if (day.startsWith(previousMonthPrefix)) previousMonthPoints += points;
      }

      const streakDays = this.computeStreak(days, now, from, dailyMinPoints);

      return {
        rank: 0,
        sellerId: seller.id,
        sellerName: seller.name,
        monthlyPoints,
        previousMonthPoints,
        pointsDelta: monthlyPoints - previousMonthPoints,
        streakDays,
      };
    });

    computed.sort((a, b) => b.monthlyPoints - a.monthlyPoints);
    computed.forEach((row, index) => {
      row.rank = index + 1;
    });

    return computed;
  }

  private monthPrefix(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  private dayStr(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private computeStreak(
    days: Map<string, number>,
    now: Date,
    lowerBound: Date,
    dailyMinPoints: number,
  ): number {
    const meets = (date: Date): boolean =>
      (days.get(this.dayStr(date)) ?? 0) >= dailyMinPoints;

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let cursor = today;

    // Grace for the in-progress day: if today does not meet the goal yet but
    // yesterday did, start counting from yesterday.
    if (!meets(cursor)) {
      cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
      if (!meets(cursor)) return 0;
    }

    let streak = 0;
    while (cursor >= lowerBound && meets(cursor)) {
      streak += 1;
      cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
    }
    return streak;
  }
}
