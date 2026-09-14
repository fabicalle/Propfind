import { PropertyRepository } from '@/application/ports';
import { CreatePropertyInput } from '@/domain/value-objects';

export class CreatePropertyUseCase {
  constructor(private propertyRepository: PropertyRepository) {}

  async execute(input: CreatePropertyInput): Promise<string> {
    const property = await this.propertyRepository.create(input);
    return property.id;
  }
}
