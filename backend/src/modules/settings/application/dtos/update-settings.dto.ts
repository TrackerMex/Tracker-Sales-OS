import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional() @IsNumber() @Min(1) dailyMinPoints?: number;
  @IsOptional() @IsNumber() @Min(0) monthlyAmountGoal?: number;
  @IsOptional() @IsNumber() @Min(0) monthlyUnitGoal?: number;
  @IsOptional() @IsNumber() @Min(0) sellerMonthlyAmountGoal?: number;
}
