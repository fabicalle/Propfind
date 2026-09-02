import { PropertyRepository, InteractionRepository } from '@/application/ports';
import { Property } from '@/domain/entities';
import { SearchParams, RecordSwipeInput } from '@/domain/value-objects';

export class SearchPropertiesUseCase {
  constructor(
    private propertyRepository: PropertyRepository,
    private interactionRepository: InteractionRepository
  ) {}

  async execute(params: SearchParams, sessionId?: string): Promise<Property[]> {
    const { bbox, filters, excludeIds = [], limit = 10, offset = 0 } = params;

    let finalExcludeIds = [...excludeIds];

    if (sessionId) {
      const recentInteractions = await this.interactionRepository.findRecentBySession(sessionId, 100);
      finalExcludeIds = [...new Set([...finalExcludeIds, ...recentInteractions.map((i) => i.propertyId)])];
    }

    return this.propertyRepository.searchByBoundingBox({
      bbox,
      filters,
      excludeIds: finalExcludeIds,
      limit,
      offset,
    });
  }
}

export class RecordSwipeUseCase {
  constructor(
    private interactionRepository: InteractionRepository,
    private propertyRepository: PropertyRepository
  ) {}

  async execute(input: RecordSwipeInput, sessionId: string, userId?: string): Promise<Property | null> {
    const interactionType =
      input.direction === 'right'
        ? 'SWIPE_RIGHT'
        : input.direction === 'up'
          ? 'SUPERLIKE'
          : 'SWIPE_LEFT';

    await this.interactionRepository.create({
      propertyId: input.propertyId,
      interactionType,
      swipeDirection: input.direction,
      sessionId,
      userId,
      metadata: input.metadata,
    });

    const recentInteractions = await this.interactionRepository.findRecentBySession(sessionId, 100);
    const excludeIds = recentInteractions.map((i) => i.propertyId);

    return this.propertyRepository.findFirstNotInIds(excludeIds);
  }
}
