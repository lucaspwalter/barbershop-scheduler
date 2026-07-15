import { AppError, isForeignKeyViolation, isUniqueViolation } from '../../errors/app-error';
import {
  ClientsRepository,
  CreateClientInput,
  UpdateClientInput,
} from './clients.repository';

export class ClientsService {
  constructor(private readonly clientsRepository = new ClientsRepository()) {}

  async create(data: CreateClientInput) {
    if (data.email) {
      const clientWithEmail = await this.clientsRepository.findByEmail(data.email);

      if (clientWithEmail) {
        throw new AppError('A client with this email already exists', 409);
      }
    }

    try {
      return await this.clientsRepository.create(data);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError('A client with this email already exists', 409);
      }

      throw error;
    }
  }

  async findAll() {
    return this.clientsRepository.findAll();
  }

  async findById(id: string) {
    const client = await this.clientsRepository.findById(id);

    if (!client) {
      throw new AppError('Client not found', 404);
    }

    return client;
  }

  async update(id: string, data: UpdateClientInput) {
    await this.findById(id);

    if (data.email) {
      const clientWithEmail = await this.clientsRepository.findByEmailExceptId(data.email, id);

      if (clientWithEmail) {
        throw new AppError('A client with this email already exists', 409);
      }
    }

    try {
      return await this.clientsRepository.update(id, data);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError('A client with this email already exists', 409);
      }

      throw error;
    }
  }

  async delete(id: string) {
    await this.findById(id);

    const hasFutureAppointments = await this.clientsRepository.hasFutureAppointments(id);

    if (hasFutureAppointments) {
      throw new AppError(
        'Client cannot be deleted while they have scheduled or confirmed future appointments',
        409,
      );
    }

    try {
      await this.clientsRepository.delete(id);
    } catch (error) {
      if (isForeignKeyViolation(error)) {
        throw new AppError('Client cannot be deleted while appointments reference it', 409);
      }

      throw error;
    }
  }
}
