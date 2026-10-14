import {
  IsString,
  IsNumber,
  IsOptional,
  IsEmail,
  Min,
  IsIn,
} from 'class-validator';

export class CreateDonationDto {
  @IsString()
  actionId: string;

  @IsNumber()
  @Min(1000, { message: 'Le montant minimum est de 1000' })
  amount: number;

  @IsString()
  @IsIn(['XAF', 'EUR', 'USD', 'GBP'])
  currency: string;

  @IsString()
  @IsIn(['Orange Money', 'MTN MoMo', 'Visa', 'Mastercard'])
  method: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  donorFirstName?: string;

  @IsOptional()
  @IsString()
  donorLastName?: string;

  @IsOptional()
  @IsEmail()
  donorEmail?: string;

  @IsOptional()
  @IsString()
  donorPhone?: string;

  @IsOptional()
  @IsString()
  donorCountry?: string;
}