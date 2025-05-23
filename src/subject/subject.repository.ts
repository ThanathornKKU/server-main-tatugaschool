import { GoogleStorageService } from './../google-storage/google-storage.service';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { Prisma, Subject } from '@prisma/client';
import {
  RequestCreateSubject,
  RequestDeleteSubject,
  RequestGetSubjectById,
  RequestReorderSubjects,
} from './interfaces';
import { PrismaService } from '../prisma/prisma.service';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { GroupOnSubjectRepository } from '../group-on-subject/group-on-subject.repository';

type Repository = {
  getSubjectById(request: RequestGetSubjectById): Promise<Subject | null>;
  findUnique(request: Prisma.SubjectFindUniqueArgs): Promise<Subject | null>;
  findMany(request: Prisma.SubjectFindManyArgs): Promise<Subject[]>;
  createSubject(request: RequestCreateSubject): Promise<Subject>;
  update(request: Prisma.SubjectUpdateArgs): Promise<Subject>;
  deleteSubject(request: RequestDeleteSubject): Promise<Subject>;
  reorderSubjects(request: RequestReorderSubjects): Promise<Subject[]>;
  count(request: Prisma.SubjectCountArgs): Promise<number>;
};
@Injectable()
export class SubjectRepository implements Repository {
  private logger: Logger = new Logger(SubjectRepository.name);
  private groupOnSubjectRepository: GroupOnSubjectRepository;
  constructor(
    private prisma: PrismaService,
    private googleStorageService: GoogleStorageService,
  ) {
    this.groupOnSubjectRepository = new GroupOnSubjectRepository(this.prisma);
  }

  async count(request: Prisma.SubjectCountArgs): Promise<number> {
    try {
      return this.prisma.subject.count(request);
    } catch (error) {
      this.logger.error(error);
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          `message: ${error.message} - codeError: ${error.code}`,
        );
      }
      throw error;
    }
  }

  async findMany(request: Prisma.SubjectFindManyArgs): Promise<Subject[]> {
    try {
      return await this.prisma.subject.findMany(request);
    } catch (error) {
      this.logger.error(error);
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          `message: ${error.message} - codeError: ${error.code}`,
        );
      }
      throw error;
    }
  }

  async findUnique(
    request: Prisma.SubjectFindUniqueArgs,
  ): Promise<Subject | null> {
    try {
      return await this.prisma.subject.findUnique(request);
    } catch (error) {
      this.logger.error(error);
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          `message: ${error.message} - codeError: ${error.code}`,
        );
      }
      throw error;
    }
  }

  async getSubjectById(
    request: RequestGetSubjectById,
  ): Promise<Subject | null> {
    try {
      return await this.prisma.subject.findUnique({
        where: {
          id: request.subjectId,
        },
      });
    } catch (error) {
      this.logger.error(error);
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          `message: ${error.message} - codeError: ${error.code}`,
        );
      }
      throw error;
    }
  }

  async createSubject(request: RequestCreateSubject): Promise<Subject> {
    try {
      return await this.prisma.subject.create({
        data: {
          ...request,
        },
      });
    } catch (error) {
      this.logger.error(error);
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          `message: ${error.message} - codeError: ${error.code}`,
        );
      }
      throw error;
    }
  }

  async update(request: Prisma.SubjectUpdateArgs): Promise<Subject> {
    try {
      return await this.prisma.subject.update(request);
    } catch (error) {
      this.logger.error(error);
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          `message: ${error.message} - codeError: ${error.code}`,
        );
      }
      throw error;
    }
  }

  async reorderSubjects(request: RequestReorderSubjects): Promise<Subject[]> {
    try {
      const updatedSubjects = request.subjectIds.map((subjectId, index) => {
        return this.prisma.subject.update({
          where: {
            id: subjectId,
          },
          data: {
            order: index,
          },
        });
      });

      return Promise.all(updatedSubjects);
    } catch (error) {
      this.logger.error(error);
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          `message: ${error.message} - codeError: ${error.code}`,
        );
      }
      throw error;
    }
  }

  async deleteSubject(request: RequestDeleteSubject): Promise<Subject> {
    try {
      const { subjectId } = request;
      const fileOnAssignments = await this.prisma.fileOnAssignment.findMany({
        where: {
          subjectId: subjectId,
        },
      });
      const groupOnSubjects = await this.groupOnSubjectRepository.findMany({
        where: {
          subjectId: request.subjectId,
        },
      });

      if (groupOnSubjects.length > 0) {
        await Promise.allSettled(
          groupOnSubjects.map((group) =>
            this.groupOnSubjectRepository.delete({
              groupOnSubjectId: group.id,
            }),
          ),
        );
      }

      // Delete related commentOnAssignments records
      await this.prisma.commentOnAssignment.deleteMany({
        where: {
          subjectId: subjectId,
        },
      });

      const fileOnStudentAssignments =
        await this.prisma.fileOnStudentAssignment.findMany({
          where: {
            subjectId: subjectId,
          },
        });

      Promise.allSettled([
        ...fileOnAssignments.map((file) =>
          this.googleStorageService.DeleteFileOnStorage({
            fileName: file.url,
          }),
        ),
        this.prisma.gradeRange.delete({
          where: {
            subjectId: subjectId,
          },
        }),
        ...fileOnStudentAssignments
          .filter((f) => f.contentType === 'FILE')
          .map((file) =>
            this.googleStorageService.DeleteFileOnStorage({
              fileName: file.body,
            }),
          ),
        this.prisma.fileOnStudentAssignment.deleteMany({
          where: {
            OR: fileOnStudentAssignments.map((f) => {
              return {
                id: f.id,
              };
            }),
          },
        }),
        this.prisma.fileOnAssignment.deleteMany({
          where: {
            OR: fileOnAssignments.map((f) => {
              return {
                id: f.id,
              };
            }),
          },
        }),
      ]);

      await this.prisma.skillOnStudentAssignment.deleteMany({
        where: {
          subjectId: subjectId,
        },
      });

      // Delete related attendance records
      await this.prisma.attendance.deleteMany({
        where: {
          subjectId: subjectId,
        },
      });
      await this.prisma.attendanceStatusList.deleteMany({
        where: {
          subjectId: subjectId,
        },
      });

      // Delete related attendanceRow records
      await this.prisma.attendanceRow.deleteMany({
        where: {
          subjectId: subjectId,
        },
      });

      // Delete related attendanceTable records
      await this.prisma.attendanceTable.deleteMany({
        where: {
          subjectId: subjectId,
        },
      });

      // Delete related scoreOnStudent records
      await this.prisma.scoreOnStudent.deleteMany({
        where: {
          subjectId: subjectId,
        },
      });

      // Delete related scoreOnSubject records
      await this.prisma.scoreOnSubject.deleteMany({
        where: {
          subjectId: subjectId,
        },
      });

      await this.prisma.studentOnAssignment.deleteMany({
        where: {
          subjectId: subjectId,
        },
      });

      // Delete related studentOnSubjects records
      await this.prisma.studentOnSubject.deleteMany({
        where: {
          subjectId: subjectId,
        },
      });

      // Delete related teacherOnSubjects records
      await this.prisma.teacherOnSubject.deleteMany({
        where: {
          subjectId: subjectId,
        },
      });

      await this.prisma.fileOnAssignment.deleteMany({
        where: {
          subjectId: subjectId,
        },
      });

      await this.prisma.fileOnStudentAssignment.deleteMany({
        where: {
          subjectId: subjectId,
        },
      });

      await this.prisma.skillOnAssignment.deleteMany({
        where: {
          subjectId: subjectId,
        },
      });

      await this.prisma.assignment.deleteMany({
        where: {
          subjectId: subjectId,
        },
      });

      // Delete the subject
      return await this.prisma.subject.delete({
        where: {
          id: subjectId,
        },
      });
    } catch (error) {
      this.logger.error(error);
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(
          `message: ${error.message} - codeError: ${error.code}`,
        );
      }
      throw error;
    }
  }
}
