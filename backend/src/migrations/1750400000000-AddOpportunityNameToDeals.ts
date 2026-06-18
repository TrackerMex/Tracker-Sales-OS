import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddOpportunityNameToDeals1750400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'deals',
      new TableColumn({
        name: 'opportunity_name',
        type: 'varchar',
        length: '200',
        isNullable: true,
        default: null,
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('deals', 'opportunity_name');
  }
}
