import { Injectable, BadRequestException } from '@nestjs/common';
import { prisma } from '@careloop/db';
import { getRedisClient } from '../../config/redis';

const SEARCH_CACHE_TTL_SECONDS = 30;
const SEARCH_CACHE_VERSION = 'v1';

function searchCacheKey(type: string, practiceId: string | undefined, query: string): string {
  return `search:${SEARCH_CACHE_VERSION}:${type}:${practiceId ?? '_'}:${query.toLowerCase()}`;
}

type SearchType = 'patients' | 'appointments' | 'treatments' | 'documents' | 'all';

interface SearchParams {
  query: string;
  type?: string;
  practiceId?: string;
  limit?: number;
}

interface SearchResult {
  type: SearchType;
  id: string;
  label: string;
  subLabel?: string;
  score?: number;
}

@Injectable()
export class SearchService {
  async search(params: SearchParams): Promise<SearchResult[]> {
    const { query, practiceId, limit = 20 } = params;
    const type = (params.type ?? 'all') as SearchType;

    if (!query || query.trim().length < 2) {
      throw new BadRequestException('Search query must be at least 2 characters');
    }

    const q = query.trim();

    // Cache results for queries >= 3 chars to reduce DB load on typeahead
    if (q.length >= 3) {
      const cacheKey = searchCacheKey(type, practiceId, q);
      try {
        const cached = await getRedisClient().get(cacheKey);
        if (cached) return JSON.parse(cached) as SearchResult[];
      } catch { /* non-fatal cache miss */ }

      const results = await this._runSearch(type, q, practiceId, limit);

      try {
        await getRedisClient().set(cacheKey, JSON.stringify(results), 'EX', SEARCH_CACHE_TTL_SECONDS);
      } catch { /* non-fatal */ }

      return results;
    }

    return this._runSearch(type, q, practiceId, limit);
  }

  private async _runSearch(
    type: SearchType,
    q: string,
    practiceId: string | undefined,
    limit: number,
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    if (type === 'patients' || type === 'all') {
      results.push(...(await this.searchPatients(q, practiceId, limit)));
    }
    if (type === 'appointments' || type === 'all') {
      results.push(...(await this.searchAppointments(q, practiceId, limit)));
    }
    if (type === 'treatments' || type === 'all') {
      results.push(...(await this.searchTreatments(q, practiceId, limit)));
    }
    if (type === 'documents' || type === 'all') {
      results.push(...(await this.searchDocuments(q, practiceId, limit)));
    }

    return results.slice(0, limit);
  }

  private async searchPatients(
    query: string,
    practiceId: string | undefined,
    limit: number
  ): Promise<SearchResult[]> {
    const tsQuery = this.toTsQuery(query);
    const rows = await prisma.$queryRawUnsafe<
      Array<{ id: string; firstName: string; lastName: string; phoneE164: string | null; rank: number }>
    >(
      `SELECT id, "firstName", "lastName", "phoneE164",
              ts_rank(search_vector, to_tsquery('english', $1)) AS rank
       FROM "Patient"
       WHERE search_vector @@ to_tsquery('english', $1)
         ${practiceId ? 'AND "practiceId" = $3' : ''}
       ORDER BY rank DESC
       LIMIT $2`,
      tsQuery,
      limit,
      ...(practiceId ? [practiceId] : [])
    );

    return rows.map((r) => ({
      type: 'patients' as const,
      id: r.id,
      label: `${r.firstName} ${r.lastName}`,
      subLabel: r.phoneE164 ?? undefined,
      score: r.rank,
    }));
  }

  private async searchAppointments(
    query: string,
    practiceId: string | undefined,
    limit: number
  ): Promise<SearchResult[]> {
    const tsQuery = this.toTsQuery(query);
    const rows = await prisma.$queryRawUnsafe<
      Array<{ id: string; title: string; start: Date; rank: number }>
    >(
      `SELECT id, title, start,
              ts_rank(search_vector, to_tsquery('english', $1)) AS rank
       FROM "Appointment"
       WHERE search_vector @@ to_tsquery('english', $1)
         ${practiceId ? 'AND "practiceId" = $3' : ''}
       ORDER BY rank DESC
       LIMIT $2`,
      tsQuery,
      limit,
      ...(practiceId ? [practiceId] : [])
    );

    return rows.map((r) => ({
      type: 'appointments' as const,
      id: r.id,
      label: r.title,
      subLabel: new Date(r.start).toISOString(),
      score: r.rank,
    }));
  }

  private async searchTreatments(
    query: string,
    practiceId: string | undefined,
    limit: number
  ): Promise<SearchResult[]> {
    const tsQuery = this.toTsQuery(query);
    const rows = await prisma.$queryRawUnsafe<
      Array<{ id: string; procedureCode: string | null; notes: string | null; rank: number }>
    >(
      `SELECT id, "procedureCode", notes,
              ts_rank(search_vector, to_tsquery('simple', $1)) AS rank
       FROM "TreatmentRecord"
       WHERE search_vector @@ to_tsquery('simple', $1)
         ${practiceId ? 'AND "practiceId" = $3' : ''}
       ORDER BY rank DESC
       LIMIT $2`,
      tsQuery,
      limit,
      ...(practiceId ? [practiceId] : [])
    );

    return rows.map((r) => ({
      type: 'treatments' as const,
      id: r.id,
      label: r.procedureCode ?? 'Treatment',
      subLabel: r.notes?.slice(0, 60) ?? undefined,
      score: r.rank,
    }));
  }

  private async searchDocuments(
    query: string,
    practiceId: string | undefined,
    limit: number
  ): Promise<SearchResult[]> {
    const tsQuery = this.toTsQuery(query);
    const rows = await prisma.$queryRawUnsafe<
      Array<{ id: string; fileName: string; category: string; rank: number }>
    >(
      `SELECT id, "fileName", category,
              ts_rank(search_vector, to_tsquery('simple', $1)) AS rank
       FROM "Document"
       WHERE search_vector @@ to_tsquery('simple', $1)
         ${practiceId ? 'AND "practiceId" = $3' : ''}
       ORDER BY rank DESC
       LIMIT $2`,
      tsQuery,
      limit,
      ...(practiceId ? [practiceId] : [])
    );

    return rows.map((r) => ({
      type: 'documents' as const,
      id: r.id,
      label: r.fileName,
      subLabel: r.category,
      score: r.rank,
    }));
  }

  /**
   * Converts a raw query string into a tsquery-safe string.
   * Sanitizes input and joins tokens with & for AND matching.
   * Falls back to prefix matching (token:*) for partial words.
   */
  private toTsQuery(query: string): string {
    const tokens = query
      .replace(/[^a-zA-Z0-9\s'-]/g, '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    if (tokens.length === 0) return '';

    return tokens.map((t) => `${t}:*`).join(' & ');
  }
}

