import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AddMemberDto } from './dto/add-member.dto';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  create(
    @Body() dto: CreateProjectDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.projectsService.create(dto, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'List projects with pagination' })
  findAll(
    @Query() pagination: PaginationDto,
    @CurrentUser() user: { userId: string; role: Role },
  ) {
    return this.projectsService.findAllForUser(
      user.userId,
      user.role,
      pagination,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project details' })
  findOne(@Param('id') id: string, @CurrentUser() user: { userId: string; role: Role }) {
    return this.projectsService.findOne(id, user.userId, user.role);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update project (admin only)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
    @CurrentUser() user: { userId: string; role: Role },
  ) {
    return this.projectsService.update(id, dto, user.userId, user.role);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Add member to project (admin only)' })
  addMember(
    @Param('id') id: string,
    @Body() dto: AddMemberDto,
    @CurrentUser() user: { userId: string },
  ) {
    return this.projectsService.addMember(id, dto, user.userId);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove member from project (admin only)' })
  removeMember(
    @Param('id') id: string,
    @Param('userId') userId: string,
    @CurrentUser() user: { userId: string },
  ) {
    return this.projectsService.removeMember(id, userId, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project (admin only)' })
  delete(@Param('id') id: string, @CurrentUser() user: { userId: string; role: Role }) {
    return this.projectsService.delete(id, user.userId, user.role);
  }
}
