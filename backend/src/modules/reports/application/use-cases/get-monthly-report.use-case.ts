import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SaleTypeormEntity } from '../../../sales/infrastructure/entities/sale.typeorm.entity';
import { SellerTypeormEntity } from '../../../sellers/infrastructure/entities/seller.typeorm.entity';
import { IUseCase } from '../../../../core/domain/use-case.interface';
import {
  MonthlyReportDto,
  TypeReport,
  SellerSalesReport,
  SourceBreakdown,
} from '../dtos/monthly-report.dto';

const AMOUNT_GOAL = 600000;
const UNIT_GOAL = 150;

interface RawTypeSaleRow {
  type: string;
  clientType: string;
  totalAmount: string | null;
  totalUnits: string | null;
  totalCount: string | null;
  newUnits: string | null;
  existingUnits: string | null;
  newAmount: string | null;
  existingAmount: string | null;
}

interface RawSellerRow {
  sellerId: string;
  sellerName: string;
  totalAmount: string | null;
  totalUnits: string | null;
  totalCount: string | null;
}

interface RawSourceRow {
  source: string;
  totalCount: string | null;
  totalAmount: string | null;
  totalUnits: string | null;
}

function emptyTypeReport(): TypeReport {
  return {
    amount: 0,
    units: 0,
    count: 0,
    newUnits: 0,
    existingUnits: 0,
    newAmount: 0,
    existingAmount: 0,
  };
}

@Injectable()
export class GetMonthlyReportUseCase
  implements IUseCase<{ month: string }, MonthlyReportDto>
{
  constructor(
    @InjectRepository(SaleTypeormEntity)
    private saleRepo: Repository<SaleTypeormEntity>,
    @InjectRepository(SellerTypeormEntity)
    private sellerRepo: Repository<SellerTypeormEntity>,
  ) {}

  async execute({ month }: { month: string }): Promise<MonthlyReportDto> {
    const [year, mon] = month.split('-').map(Number);
    const start = new Date(year, mon - 1, 1);
    const end = new Date(year, mon, 1);

    const typeRows = await this.saleRepo
      .createQueryBuilder('s')
      .select('s.type', 'type')
      .addSelect('s.client_type', 'clientType')
      .addSelect('SUM(s.amount)', 'totalAmount')
      .addSelect('SUM(s.units)', 'totalUnits')
      .addSelect('COUNT(s.id)', 'totalCount')
      .addSelect(
        "SUM(CASE WHEN s.client_type = 'Nuevo' THEN s.units ELSE 0 END)",
        'newUnits',
      )
      .addSelect(
        "SUM(CASE WHEN s.client_type = 'Existente' THEN s.units ELSE 0 END)",
        'existingUnits',
      )
      .addSelect(
        "SUM(CASE WHEN s.client_type = 'Nuevo' THEN s.amount ELSE 0 END)",
        'newAmount',
      )
      .addSelect(
        "SUM(CASE WHEN s.client_type = 'Existente' THEN s.amount ELSE 0 END)",
        'existingAmount',
      )
      .where('s.date >= :start AND s.date < :end', { start, end })
      .andWhere('s.deleted_at IS NULL')
      .groupBy('s.type')
      .addGroupBy('s.client_type')
      .getRawMany<RawTypeSaleRow>();

    const sellerRows = await this.saleRepo
      .createQueryBuilder('s')
      .innerJoin(
        SellerTypeormEntity,
        'sl',
        'sl.id = s.seller_id AND sl.deleted_at IS NULL',
      )
      .select('s.seller_id', 'sellerId')
      .addSelect('sl.name', 'sellerName')
      .addSelect('SUM(s.amount)', 'totalAmount')
      .addSelect('SUM(s.units)', 'totalUnits')
      .addSelect('COUNT(s.id)', 'totalCount')
      .where('s.date >= :start AND s.date < :end', { start, end })
      .andWhere('s.deleted_at IS NULL')
      .andWhere("s.type = 'seller'")
      .groupBy('s.seller_id')
      .addGroupBy('sl.name')
      .orderBy('SUM(s.amount)', 'DESC')
      .getRawMany<RawSellerRow>();

    const sourceRows = await this.saleRepo
      .createQueryBuilder('s')
      .select('s.source', 'source')
      .addSelect('COUNT(s.id)', 'totalCount')
      .addSelect('SUM(s.amount)', 'totalAmount')
      .addSelect('SUM(s.units)', 'totalUnits')
      .where('s.date >= :start AND s.date < :end', { start, end })
      .andWhere('s.deleted_at IS NULL')
      .groupBy('s.source')
      .orderBy('SUM(s.amount)', 'DESC')
      .getRawMany<RawSourceRow>();

    const aggregateByType = (typeName: string): TypeReport => {
      const rows = typeRows.filter((r) => r.type === typeName);
      return rows.reduce(
        (acc, r) => ({
          amount: acc.amount + (Number(r.totalAmount) || 0),
          units: acc.units + (Number(r.totalUnits) || 0),
          count: acc.count + (Number(r.totalCount) || 0),
          newUnits: acc.newUnits + (Number(r.newUnits) || 0),
          existingUnits: acc.existingUnits + (Number(r.existingUnits) || 0),
          newAmount: acc.newAmount + (Number(r.newAmount) || 0),
          existingAmount: acc.existingAmount + (Number(r.existingAmount) || 0),
        }),
        emptyTypeReport(),
      );
    };

    const direction = aggregateByType('direction');
    const atc = aggregateByType('atc');
    const team = aggregateByType('seller');

    const total: TypeReport = {
      amount: direction.amount + atc.amount + team.amount,
      units: direction.units + atc.units + team.units,
      count: direction.count + atc.count + team.count,
      newUnits: direction.newUnits + atc.newUnits + team.newUnits,
      existingUnits:
        direction.existingUnits + atc.existingUnits + team.existingUnits,
      newAmount: direction.newAmount + atc.newAmount + team.newAmount,
      existingAmount:
        direction.existingAmount + atc.existingAmount + team.existingAmount,
    };

    const sellers: SellerSalesReport[] = sellerRows.map((r) => ({
      sellerId: r.sellerId,
      sellerName: r.sellerName,
      amount: Number(r.totalAmount) || 0,
      units: Number(r.totalUnits) || 0,
      count: Number(r.totalCount) || 0,
    }));

    const bySource: SourceBreakdown[] = sourceRows.map((r) => ({
      source: r.source,
      count: Number(r.totalCount) || 0,
      amount: Number(r.totalAmount) || 0,
      units: Number(r.totalUnits) || 0,
    }));

    const commercialHealth = Math.min(
      100,
      Math.round(
        (total.amount / AMOUNT_GOAL) * 50 + (total.units / UNIT_GOAL) * 50,
      ),
    );

    return {
      month,
      monthlyAmountGoal: AMOUNT_GOAL,
      monthlyUnitGoal: UNIT_GOAL,
      direction,
      atc,
      team,
      total,
      sellers,
      bySource,
      commercialHealth,
    };
  }
}
