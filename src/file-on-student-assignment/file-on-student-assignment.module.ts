import { Module } from '@nestjs/common';
import { FileOnStudentAssignmentService } from './file-on-student-assignment.service';
import { FileOnStudentAssignmentController } from './file-on-student-assignment.controller';
import { SubjectService } from '../subject/subject.service';
import { WheelOfNameService } from '../wheel-of-name/wheel-of-name.service';
import { AttendanceTableService } from '../attendance-table/attendance-table.service';
import { TeacherOnSubjectService } from '../teacher-on-subject/teacher-on-subject.service';
import { ClassService } from '../class/class.service';
import { MemberOnSchoolService } from '../member-on-school/member-on-school.service';
import { SchoolService } from '../school/school.service';
import { HttpModule } from '@nestjs/axios';
import { StudentService } from '../student/student.service';
import { GradeService } from '../grade/grade.service';
import { UsersService } from '../users/users.service';

@Module({
  imports: [HttpModule],
  providers: [
    FileOnStudentAssignmentService,
    SubjectService,
    WheelOfNameService,
    AttendanceTableService,
    TeacherOnSubjectService,
    ClassService,
    MemberOnSchoolService,
    SchoolService,
    StudentService,
    GradeService,
    UsersService,
  ],
  controllers: [FileOnStudentAssignmentController],
})
export class FileOnStudentAssignmentModule {}
