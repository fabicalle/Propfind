import { PropertyRepository, InteractionRepository } from '@/application/ports';
import { Property } from '@/domain/entities';
import { RecordSwipeInput } from '@/domain/value-objects';
import { SearchParams as NewSearchParams, PagedResult } from '@/types/search';

export class SearchPropertiesUseCase {
  constructor(
    private propertyRepository: PropertyRepository,
    private interactionRepository: InteractionRepository
  ) {}

  async execute(params: NewSearchParams, sessionId?: string): Promise<PagedResult<Property>> {
     const { excludeIds = [] } = params;

    let finalParams: NewSearchParams = { ...params };

    if (sessionId) {
      const recentInteractions = await this.interactionRepository.findRecentBySession(sessionId, 100);
      finalParams = {
        ...params,
        excludeIds: [...new Set([...excludeIds, ...recentInteractions.map((i) => i.propertyId)])],
      };
    }

    return this.propertyRepository.search(finalParams);
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
