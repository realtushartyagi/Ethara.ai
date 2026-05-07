import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  @Get()
  @ApiOperation({ summary: 'API info' })
  getHello(): { message: string } {
    return { message: 'Team Task Manager API v1' };
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check for Railway / uptime monitors' })
  getHealth(): { status: string; timestamp: string; uptime: number } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
