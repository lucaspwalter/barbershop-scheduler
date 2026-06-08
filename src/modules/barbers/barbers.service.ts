import { AppError, isUniqueViolation } from '../../errors/app-error';
import {
  BarbersRepository,
  CreateBarberInput,
  UpdateBarberInput,
} from './barbers.repository';

export class BarbersService {
  constructor(private readonly barbersRepository = new BarbersRepository()) {}

  async create(data: CreateBarberInput) {
    const barberWithEmail = await this.barbersRepository.findByEmail(data.email);

    if (barberWithEmail) {
      throw new AppError('A barber with this email already exists', 409);
    }

    try {
      return await this.barbersRepository.create(data);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError('A barber with this email already exists', 409);
      }

      throw error;
    }
  }

  async findAll(includeInactive = false) {
    return this.barbersRepository.findAll(includeInactive);
  }

  async findById(id: string) {
    const barber = await this.barbersRepository.findById(id);

    if (!barber) {
      throw new AppError('Barber not found', 404);
    }

    return barber;
  }

  async update(id: string, data: UpdateBarberInput) {
    await this.findById(id);

    if (data.email) {
      const barberWithEmail = await this.barbersRepository.findByEmailExceptId(data.email, id);

      if (barberWithEmail) {
        throw new AppError('A barber with this email already exists', 409);
      }
    }

    try {
      return await this.barbersRepository.update(id, data);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError('A barber with this email already exists', 409);
      }

      throw error;
    }
  }

  async softDelete(id: string) {
    await this.findById(id);
    await this.barbersRepository.softDelete(id);
  }
}
