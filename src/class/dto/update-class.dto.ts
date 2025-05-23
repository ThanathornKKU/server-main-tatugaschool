import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class ReorderClassDto {
  @IsArray()
  @IsNotEmpty({ each: true })
  @IsMongoId({ each: true })
  @ArrayMinSize(2)
  classIds: string[];
}

class UpdateClassQuery {
  @IsNotEmpty()
  @IsMongoId()
  classId: string;
}

class UpdateClassBody {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  level?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isAchieved?: boolean;
}

export class UpdateClassDto {
  @IsNotEmpty()
  @IsObject()
  @Type(() => UpdateClassQuery)
  @ValidateNested()
  query: UpdateClassQuery;

  @IsNotEmpty()
  @IsObject()
  @Type(() => UpdateClassBody)
  @ValidateNested()
  body: UpdateClassBody;
}
