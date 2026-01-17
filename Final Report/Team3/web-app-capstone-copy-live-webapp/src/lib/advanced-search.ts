/**
 * Advanced Search Service
 * Provides comprehensive search capabilities across all healthcare data
 */

import { Client, Medication, Appointment, Provider } from '@/types';
import Fuse from 'fuse.js';

export interface SearchOptions {
  query: string;
  searchIn: SearchableEntity[];
  filters?: SearchFilters;
  fuzzySearch?: boolean;
  limit?: number;
  sortBy?: SortOption;
}

export enum SearchableEntity {
  CLIENTS = 'clients',
  MEDICATIONS = 'medications',
  APPOINTMENTS = 'appointments',
  PROVIDERS = 'providers',
  NOTES = 'notes',
  DOCUMENTS = 'documents'
}

export interface SearchFilters {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  status?: string[];
  category?: string[];
  tags?: string[];
  clientId?: string;
  providerId?: string;
  urgency?: 'low' | 'medium' | 'high' | 'critical';
}

export interface SortOption {
  field: string;
  direction: 'asc' | 'desc';
}

export interface SearchResult<T = any> {
  item: T;
  score: number;
  matches?: SearchMatch[];
  type: SearchableEntity;
}

export interface SearchMatch {
  field: string;
  value: string;
  indices: [number, number][];
}

export interface SearchIndex {
  clients?: Fuse<Client>;
  medications?: Fuse<Medication>;
  appointments?: Fuse<Appointment>;
  providers?: Fuse<Provider>;
}

class AdvancedSearchService {
  private searchIndices: SearchIndex = {};
  private searchHistory: SearchHistoryItem[] = [];
  private readonly MAX_HISTORY_ITEMS = 50;

  /**
   * Initialize search indices with data
   */
  initializeIndices(data: {
    clients?: Client[];
    medications?: Medication[];
    appointments?: Appointment[];
    providers?: Provider[];
  }): void {
    if (data.clients) {
      this.searchIndices.clients = new Fuse(data.clients, {
        keys: [
          { name: 'firstName', weight: 0.3 },
          { name: 'lastName', weight: 0.3 },
          { name: 'email', weight: 0.2 },
          { name: 'phoneNumber', weight: 0.1 },
          { name: 'address', weight: 0.1 },
          { name: 'medicalRecordNumber', weight: 0.2 },
          { name: 'conditions', weight: 0.2 },
          { name: 'allergies', weight: 0.2 }
        ],
        includeScore: true,
        includeMatches: true,
        threshold: 0.3,
        minMatchCharLength: 2
      });
    }

    if (data.medications) {
      this.searchIndices.medications = new Fuse(data.medications, {
        keys: [
          { name: 'name', weight: 0.4 },
          { name: 'genericName', weight: 0.3 },
          { name: 'manufacturer', weight: 0.1 },
          { name: 'prescribingDoctor', weight: 0.2 },
          { name: 'instructions', weight: 0.2 },
          { name: 'sideEffects', weight: 0.1 }
        ],
        includeScore: true,
        includeMatches: true,
        threshold: 0.3
      });
    }

    if (data.appointments) {
      this.searchIndices.appointments = new Fuse(data.appointments, {
        keys: [
          { name: 'title', weight: 0.3 },
          { name: 'description', weight: 0.2 },
          { name: 'provider', weight: 0.2 },
          { name: 'location', weight: 0.2 },
          { name: 'notes', weight: 0.1 },
          { name: 'type', weight: 0.1 }
        ],
        includeScore: true,
        includeMatches: true,
        threshold: 0.3
      });
    }

    if (data.providers) {
      this.searchIndices.providers = new Fuse(data.providers, {
        keys: [
          { name: 'name', weight: 0.3 },
          { name: 'specialty', weight: 0.3 },
          { name: 'hospital', weight: 0.2 },
          { name: 'email', weight: 0.1 },
          { name: 'phone', weight: 0.1 }
        ],
        includeScore: true,
        includeMatches: true,
        threshold: 0.3
      });
    }
  }

  /**
   * Perform advanced search across multiple entities
   */
  async search(options: SearchOptions): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const { query, searchIn, filters, limit = 50, sortBy } = options;

    // Save to search history
    this.addToHistory(query, searchIn);

    // Search in each specified entity
    for (const entity of searchIn) {
      const entityResults = await this.searchEntity(entity, query, filters);
      results.push(...entityResults);
    }

    // Apply sorting
    if (sortBy) {
      results.sort((a, b) => {
        const aValue = this.getNestedValue(a.item, sortBy.field);
        const bValue = this.getNestedValue(b.item, sortBy.field);
        
        if (sortBy.direction === 'asc') {
          return aValue > bValue ? 1 : -1;
        } else {
          return aValue < bValue ? 1 : -1;
        }
      });
    } else {
      // Default sort by relevance score
      results.sort((a, b) => a.score - b.score);
    }

    // Apply limit
    return results.slice(0, limit);
  }

  /**
   * Search within a specific entity type
   */
  private async searchEntity(
    entity: SearchableEntity,
    query: string,
    filters?: SearchFilters
  ): Promise<SearchResult[]> {
    let results: SearchResult[] = [];

    switch (entity) {
      case SearchableEntity.CLIENTS:
        if (this.searchIndices.clients) {
          const searchResults = this.searchIndices.clients.search(query);
          results = searchResults.map(result => ({
            item: result.item,
            score: result.score || 0,
            matches: this.formatMatches(result.matches),
            type: SearchableEntity.CLIENTS
          }));
        }
        break;

      case SearchableEntity.MEDICATIONS:
        if (this.searchIndices.medications) {
          const searchResults = this.searchIndices.medications.search(query);
          results = searchResults.map(result => ({
            item: result.item,
            score: result.score || 0,
            matches: this.formatMatches(result.matches),
            type: SearchableEntity.MEDICATIONS
          }));
        }
        break;

      case SearchableEntity.APPOINTMENTS:
        if (this.searchIndices.appointments) {
          const searchResults = this.searchIndices.appointments.search(query);
          results = searchResults.map(result => ({
            item: result.item,
            score: result.score || 0,
            matches: this.formatMatches(result.matches),
            type: SearchableEntity.APPOINTMENTS
          }));
        }
        break;

      case SearchableEntity.PROVIDERS:
        if (this.searchIndices.providers) {
          const searchResults = this.searchIndices.providers.search(query);
          results = searchResults.map(result => ({
            item: result.item,
            score: result.score || 0,
            matches: this.formatMatches(result.matches),
            type: SearchableEntity.PROVIDERS
          }));
        }
        break;
    }

    // Apply filters
    if (filters) {
      results = this.applyFilters(results, filters);
    }

    return results;
  }

  /**
   * Apply filters to search results
   */
  private applyFilters(results: SearchResult[], filters: SearchFilters): SearchResult[] {
    return results.filter(result => {
      // Date range filter
      if (filters.dateRange) {
        const itemDate = this.getItemDate(result.item, result.type);
        if (itemDate) {
          if (itemDate < filters.dateRange.startDate || itemDate > filters.dateRange.endDate) {
            return false;
          }
        }
      }

      // Status filter
      if (filters.status && filters.status.length > 0) {
        const itemStatus = result.item.status;
        if (itemStatus && !filters.status.includes(itemStatus)) {
          return false;
        }
      }

      // Client ID filter
      if (filters.clientId) {
        const itemClientId = result.item.clientId;
        if (itemClientId && itemClientId !== filters.clientId) {
          return false;
        }
      }

      // Provider ID filter
      if (filters.providerId) {
        const itemProviderId = result.item.providerId || result.item.provider;
        if (itemProviderId && itemProviderId !== filters.providerId) {
          return false;
        }
      }

      return true;
    });
  }

  /**
   * Get date from item based on entity type
   */
  private getItemDate(item: any, type: SearchableEntity): Date | null {
    switch (type) {
      case SearchableEntity.APPOINTMENTS:
        return item.scheduledAt ? new Date(item.scheduledAt) : null;
      case SearchableEntity.MEDICATIONS:
        return item.startDate ? new Date(item.startDate) : null;
      case SearchableEntity.CLIENTS:
        return item.createdAt ? new Date(item.createdAt) : null;
      default:
        return null;
    }
  }

  /**
   * Format Fuse.js matches for consistent output
   */
  private formatMatches(matches?: any[]): SearchMatch[] {
    if (!matches) return [];
    
    return matches.map(match => ({
      field: match.key,
      value: match.value,
      indices: match.indices
    }));
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Get search suggestions based on partial query
   */
  async getSuggestions(
    partialQuery: string,
    entity: SearchableEntity,
    limit: number = 10
  ): Promise<string[]> {
    const results = await this.searchEntity(entity, partialQuery);
    const suggestions = new Set<string>();

    results.slice(0, limit).forEach(result => {
      result.matches?.forEach(match => {
        if (match.value && match.value.toLowerCase().includes(partialQuery.toLowerCase())) {
          suggestions.add(match.value);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  }

  /**
   * Add search to history
   */
  private addToHistory(query: string, entities: SearchableEntity[]): void {
    const historyItem: SearchHistoryItem = {
      query,
      entities,
      timestamp: new Date().toISOString(),
      id: `search_${Date.now()}`
    };

    this.searchHistory.unshift(historyItem);
    
    // Limit history size
    if (this.searchHistory.length > this.MAX_HISTORY_ITEMS) {
      this.searchHistory = this.searchHistory.slice(0, this.MAX_HISTORY_ITEMS);
    }
  }

  /**
   * Get search history
   */
  getSearchHistory(limit?: number): SearchHistoryItem[] {
    return limit ? this.searchHistory.slice(0, limit) : this.searchHistory;
  }

  /**
   * Clear search history
   */
  clearSearchHistory(): void {
    this.searchHistory = [];
  }

  /**
   * Get popular search terms
   */
  getPopularSearches(): { term: string; count: number }[] {
    const termCounts = new Map<string, number>();
    
    this.searchHistory.forEach(item => {
      const count = termCounts.get(item.query) || 0;
      termCounts.set(item.query, count + 1);
    });

    return Array.from(termCounts.entries())
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  /**
   * Export search results
   */
  exportResults(results: SearchResult[], format: 'json' | 'csv'): string {
    if (format === 'json') {
      return JSON.stringify(results, null, 2);
    } else {
      // CSV export
      const headers = ['Type', 'Score', 'Data'];
      const rows = results.map(result => [
        result.type,
        result.score.toFixed(3),
        JSON.stringify(result.item)
      ]);
      
      return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
  }
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  entities: SearchableEntity[];
  timestamp: string;
}

// Export singleton instance
export const advancedSearchService = new AdvancedSearchService();

/**
 * React hook for advanced search
 */
export function useAdvancedSearch() {
  const [searching, setSearching] = React.useState(false);
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const search = async (options: SearchOptions): Promise<SearchResult[]> => {
    setSearching(true);
    setError(null);

    try {
      const searchResults = await advancedSearchService.search(options);
      setResults(searchResults);
      return searchResults;
    } catch (err: any) {
      setError(err.message || 'Search failed');
      return [];
    } finally {
      setSearching(false);
    }
  };

  const getSuggestions = async (
    partialQuery: string,
    entity: SearchableEntity
  ): Promise<string[]> => {
    try {
      return await advancedSearchService.getSuggestions(partialQuery, entity);
    } catch (err: any) {
      setError(err.message || 'Failed to get suggestions');
      return [];
    }
  };

  return {
    search,
    getSuggestions,
    results,
    searching,
    error,
    searchHistory: advancedSearchService.getSearchHistory(10),
    popularSearches: advancedSearchService.getPopularSearches(),
    clearHistory: () => advancedSearchService.clearSearchHistory()
  };
}

// Import React for the hook
import React from 'react';