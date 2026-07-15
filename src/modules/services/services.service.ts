import { AppError } from '../../errors/app-error';
import {
  CreateServiceInput,
  ServicesRepository,
  UpdateServiceInput,
} from './services.repository';

export class ServicesService {
  constructor(private readonly servicesRepository = new ServicesRepository()) {}

  async create(data: CreateServiceInput) {
    return this.servicesRepository.create(data);
  }

  async findAll(includeInactive = false) {
    return this.servicesRepository.findAll(includeInactive);
  }

  async findById(id: string) {
    const service = await this.servicesRepository.findById(id);

    if (!service) {
      throw new AppError('Service not found', 404);
    }

    return service;
  }

  async update(id: string, data: UpdateServiceInput) {
    await this.findById(id);
    return this.servicesRepository.update(id, data);
  }

  async softDelete(id: string) {
    await this.findById(id);
    await this.servicesRepository.softDelete(id);
  }
}
