import { User } from '@prisma/client';
import { GetUser } from '../auth/decorators';
import {
  CreateGroupOnSubjectDto,
  DeleteGroupOnSubjectDto,
  GetGroupOnSubjectDto,
  GetGroupOnSubjectsDto,
  RefetchGroupOnSubjectDto,
  UpdateGroupOnSubjectDto,
} from './dto';
import { GroupOnSubjectService } from './group-on-subject.service';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserGuard } from '../auth/guard';

@Controller('v1/group-on-subjects')
export class GroupOnSubjectController {
  constructor(private groupOnSubjectService: GroupOnSubjectService) {}

  @Get('subject/:subjectId')
  @UseGuards(UserGuard)
  async getBySubjectId(
    @Param() dto: GetGroupOnSubjectsDto,
    @GetUser() user: User,
  ) {
    return await this.groupOnSubjectService.getGroupOnSubjects(dto, user);
  }

  @Get(':groupOnSubjectId')
  @UseGuards(UserGuard)
  async get(@Param() dto: GetGroupOnSubjectDto, @GetUser() user: User) {
    return await this.groupOnSubjectService.getGroupOnSubject(dto, user);
  }

  @Post()
  @UseGuards(UserGuard)
  async create(@Body() dto: CreateGroupOnSubjectDto, @GetUser() user: User) {
    return await this.groupOnSubjectService.create(dto, user);
  }

  @Patch()
  @UseGuards(UserGuard)
  async update(@Body() dto: UpdateGroupOnSubjectDto, @GetUser() user: User) {
    return await this.groupOnSubjectService.update(dto, user);
  }

  @Patch('refetch')
  @UseGuards(UserGuard)
  async refetch(@Body() dto: RefetchGroupOnSubjectDto, @GetUser() user: User) {
    return await this.groupOnSubjectService.refetchGroup(dto, user);
  }

  @Delete(':groupOnSubjectId')
  @UseGuards(UserGuard)
  async delete(@Param() dto: DeleteGroupOnSubjectDto, @GetUser() user: User) {
    return await this.groupOnSubjectService.delete(dto, user);
  }
}
