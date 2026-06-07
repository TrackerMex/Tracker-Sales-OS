import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UserRole } from '../../auth/domain/entities/user.entity';
import { JwtAuthGuard } from '../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../auth/presentation/decorators/roles.decorator';
import {
  CreateClientDto,
  CreateContactDto,
  GetClientsQueryDto,
  UpdateClientDto,
} from '../application/dtos/client.dto';
import { AddContactUseCase } from '../application/use-cases/add-contact.use-case';
import { CreateClientUseCase } from '../application/use-cases/create-client.use-case';
import { DeleteClientUseCase } from '../application/use-cases/delete-client.use-case';
import { GetClientsUseCase } from '../application/use-cases/get-clients.use-case';
import { UpdateClientUseCase } from '../application/use-cases/update-client.use-case';

@ApiTags('clients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin, UserRole.Director, UserRole.Seller)
@Controller('clients')
export class ClientsController {
  constructor(
    private readonly getClientsUseCase: GetClientsUseCase,
    private readonly createClientUseCase: CreateClientUseCase,
    private readonly updateClientUseCase: UpdateClientUseCase,
    private readonly addContactUseCase: AddContactUseCase,
    private readonly deleteClientUseCase: DeleteClientUseCase,
  ) {}

  @Get()
  @ApiQuery({ name: 'stage', required: false })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'seller', required: false })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query() query: GetClientsQueryDto, @Req() req: { user: any }) {
    return this.getClientsUseCase.execute({ query, user: req.user });
  }

  @Post()
  create(@Body() dto: CreateClientDto, @Req() req: { user: any }) {
    return this.createClientUseCase.execute({ dto, user: req.user });
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @Req() req: { user: any },
  ) {
    return this.updateClientUseCase.execute({ id, dto, user: req.user });
  }

  @Post(':id/contacts')
  addContact(
    @Param('id') id: string,
    @Body() dto: CreateContactDto,
    @Req() req: { user: any },
  ) {
    return this.addContactUseCase.execute({
      clientId: id,
      dto,
      user: req.user,
    });
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req: { user: any }) {
    return this.deleteClientUseCase.execute({ id, user: req.user });
  }
}
