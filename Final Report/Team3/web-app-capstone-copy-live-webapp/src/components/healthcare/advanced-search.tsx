'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  advancedSearchService,
  useAdvancedSearch,
  SearchableEntity,
  SearchOptions,
  SearchResult,
  SearchFilters
} from '@/lib/advanced-search';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Search,
  X,
  Filter,
  Users,
  Pill,
  Calendar,
  FileText,
  Clock,
  TrendingUp,
  ChevronRight,
  Download,
  History
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { useClients } from '@/hooks/use-clients';
import { useMedications } from '@/hooks/use-medications';
import { useAppointments } from '@/hooks/use-appointments';
import { ContentSkeleton } from '@/components/ui/skeleton-loaders';

export function AdvancedSearch() {
  const [query, setQuery] = useState('');
  const [selectedEntities, setSelectedEntities] = useState<SearchableEntity[]>([
    SearchableEntity.CLIENTS,
    SearchableEntity.MEDICATIONS,
    SearchableEntity.APPOINTMENTS
  ]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { clients } = useClients();
  const { medications } = useMedications();
  const { appointments } = useAppointments();
  
  const {
    search,
    getSuggestions,
    results,
    searching,
    error,
    searchHistory,
    popularSearches,
    clearHistory
  } = useAdvancedSearch();

  // Initialize search indices when data loads
  useEffect(() => {
    if (clients || medications || appointments) {
      advancedSearchService.initializeIndices({
        clients: clients || [],
        medications: medications || [],
        appointments: appointments || []
      });
    }
  }, [clients, medications, appointments]);

  // Fetch suggestions as user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.length >= 2) {
        const allSuggestions: string[] = [];
        
        for (const entity of selectedEntities) {
          const entitySuggestions = await getSuggestions(query, entity);
          allSuggestions.push(...entitySuggestions);
        }
        
        setSuggestions([...new Set(allSuggestions)].slice(0, 5));
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, selectedEntities]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    const searchOptions: SearchOptions = {
      query,
      searchIn: selectedEntities,
      filters,
      fuzzySearch: true,
      limit: 50
    };

    await search(searchOptions);
    setShowSuggestions(false);
  };

  const handleEntityToggle = (entity: SearchableEntity) => {
    setSelectedEntities(prev =>
      prev.includes(entity)
        ? prev.filter(e => e !== entity)
        : [...prev, entity]
    );
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch();
  };

  const handleHistoryClick = (historyQuery: string) => {
    setQuery(historyQuery);
    handleSearch();
  };

  const getEntityIcon = (entity: SearchableEntity) => {
    switch (entity) {
      case SearchableEntity.CLIENTS:
        return <Users className="h-4 w-4" />;
      case SearchableEntity.MEDICATIONS:
        return <Pill className="h-4 w-4" />;
      case SearchableEntity.APPOINTMENTS:
        return <Calendar className="h-4 w-4" />;
      case SearchableEntity.DOCUMENTS:
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getResultIcon = (type: SearchableEntity) => {
    switch (type) {
      case SearchableEntity.CLIENTS:
        return <Users className="h-5 w-5 text-blue-600" />;
      case SearchableEntity.MEDICATIONS:
        return <Pill className="h-5 w-5 text-green-600" />;
      case SearchableEntity.APPOINTMENTS:
        return <Calendar className="h-5 w-5 text-purple-600" />;
      default:
        return <FileText className="h-5 w-5 text-gray-600" />;
    }
  };

  const formatResultTitle = (result: SearchResult): string => {
    switch (result.type) {
      case SearchableEntity.CLIENTS:
        return `${result.item.firstName} ${result.item.lastName}`;
      case SearchableEntity.MEDICATIONS:
        return result.item.name;
      case SearchableEntity.APPOINTMENTS:
        return result.item.title;
      default:
        return 'Unknown';
    }
  };

  const formatResultSubtitle = (result: SearchResult): string => {
    switch (result.type) {
      case SearchableEntity.CLIENTS:
        return result.item.email || result.item.phoneNumber || '';
      case SearchableEntity.MEDICATIONS:
        return `${result.item.dosage} ${result.item.unit} - ${result.item.frequency}`;
      case SearchableEntity.APPOINTMENTS:
        const date = new Date(result.item.scheduledAt);
        return `${date.toLocaleDateString()} at ${date.toLocaleTimeString()}`;
      default:
        return '';
    }
  };

  const exportSearchResults = () => {
    if (results.length === 0) return;
    
    const exportData = advancedSearchService.exportResults(results, 'csv');
    const blob = new Blob([exportData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `search_results_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Advanced Search
          </CardTitle>
          <CardDescription>
            Search across clients, medications, appointments, and more
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for clients, medications, appointments..."
              className="pr-24"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {query && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setQuery('');
                    setSuggestions([]);
                    setShowSuggestions(false);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Button size="sm" onClick={handleSearch} disabled={searching}>
                {searching ? 'Searching...' : 'Search'}
              </Button>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border rounded-lg shadow-lg">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-gray-400" />
                      <span>{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Entity Selection */}
          <div className="flex flex-wrap gap-2">
            <Label className="text-sm text-gray-600">Search in:</Label>
            {Object.values(SearchableEntity).map((entity) => (
              <div key={entity} className="flex items-center space-x-2">
                <Checkbox
                  id={entity}
                  checked={selectedEntities.includes(entity)}
                  onCheckedChange={() => handleEntityToggle(entity)}
                />
                <Label
                  htmlFor={entity}
                  className="flex items-center gap-1 cursor-pointer text-sm"
                >
                  {getEntityIcon(entity)}
                  <span className="capitalize">{entity}</span>
                </Label>
              </div>
            ))}
          </div>

          {/* Filters Toggle */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>

            {results.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={exportSearchResults}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
            )}
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <Card className="p-4">
              <div className="space-y-4">
                <div>
                  <Label>Date Range</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      type="date"
                      onChange={(e) => setFilters({
                        ...filters,
                        dateRange: {
                          startDate: new Date(e.target.value),
                          endDate: filters.dateRange?.endDate || new Date()
                        }
                      })}
                    />
                    <Input
                      type="date"
                      onChange={(e) => setFilters({
                        ...filters,
                        dateRange: {
                          startDate: filters.dateRange?.startDate || new Date(),
                          endDate: new Date(e.target.value)
                        }
                      })}
                    />
                  </div>
                </div>
              </div>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Search Results and Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Results */}
        <div className="lg:col-span-2 space-y-4">
          {searching && <ContentSkeleton lines={5} />}
          
          {!searching && results.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  Found {results.length} result{results.length !== 1 ? 's' : ''}
                </p>
              </div>

              <div className="space-y-3">
                {results.map((result, index) => (
                  <Card
                    key={index}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedResult(result)}
                  >
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        {getResultIcon(result.type)}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{formatResultTitle(result)}</h3>
                            <Badge variant="outline" className="text-xs">
                              {result.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {formatResultSubtitle(result)}
                          </p>
                          {result.matches && result.matches.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {result.matches.slice(0, 2).map((match, i) => (
                                <p key={i} className="text-xs text-gray-500">
                                  <span className="font-medium">{match.field}:</span>{' '}
                                  <span className="bg-yellow-100 px-1 rounded">
                                    {match.value}
                                  </span>
                                </p>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className="text-xs text-gray-400">
                              Relevance: {((1 - result.score) * 100).toFixed(0)}%
                            </span>
                            <ChevronRight className="h-4 w-4 text-gray-400" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}

          {!searching && query && results.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600">No results found for "{query}"</p>
                <p className="text-sm text-gray-500 mt-1">
                  Try adjusting your search terms or filters
                </p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <p className="text-red-800">{error}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Popular Searches */}
          {popularSearches.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Popular Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {popularSearches.slice(0, 5).map((item, index) => (
                    <button
                      key={index}
                      className="w-full text-left px-2 py-1 hover:bg-gray-50 rounded text-sm"
                      onClick={() => handleHistoryClick(item.term)}
                    >
                      <div className="flex items-center justify-between">
                        <span>{item.term}</span>
                        <Badge variant="secondary" className="text-xs">
                          {item.count}
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Searches */}
          {searchHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Recent Searches
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {searchHistory.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      className="w-full text-left px-2 py-1 hover:bg-gray-50 rounded text-sm"
                      onClick={() => handleHistoryClick(item.query)}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate">{item.query}</span>
                        <Clock className="h-3 w-3 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
                {searchHistory.length > 5 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full mt-2"
                    onClick={clearHistory}
                  >
                    Clear History
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Result Detail Dialog */}
      {selectedResult && (
        <Dialog open={!!selectedResult} onOpenChange={() => setSelectedResult(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getResultIcon(selectedResult.type)}
                {formatResultTitle(selectedResult)}
              </DialogTitle>
              <DialogDescription>
                {selectedResult.type} Details
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <pre className="bg-gray-50 p-4 rounded-lg overflow-auto text-sm">
                {JSON.stringify(selectedResult.item, null, 2)}
              </pre>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}