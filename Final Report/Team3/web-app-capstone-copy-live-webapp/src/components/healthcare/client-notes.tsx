'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Lock,
  Unlock,
  PenTool,
  Eye,
  Calendar,
  User,
  Clock,
  Tag,
  History,
  CheckCircle,
  AlertTriangle,
  Info,
  Thermometer,
  Activity,
  Heart,
  Zap,
  Scale,
  Ruler,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy
} from 'lucide-react';
import { format, parseISO, isAfter, isBefore, isWithinInterval } from 'date-fns';
import { 
  ClientNote,
  NoteType,
  NoteCategory,
  VitalSigns,
  NoteTemplate,
  useClientNotes,
  clientNotesService
} from '@/lib/client-notes';
import { useToast } from '@/hooks/use-toast';
import { useCaregiverPermissions } from '@/hooks/use-caregiver-permissions';

interface ClientNotesProps {
  clientId: string;
  className?: string;
}

interface NoteFilters {
  type?: NoteType;
  category?: NoteCategory;
  dateRange?: { start: Date; end: Date };
  provider?: string;
  searchQuery?: string;
  isLocked?: boolean;
}

interface VitalSignsInputProps {
  vitalSigns?: VitalSigns;
  onChange: (vitalSigns: VitalSigns) => void;
}

const VitalSignsInput: React.FC<VitalSignsInputProps> = ({ vitalSigns, onChange }) => {
  const handleChange = (field: keyof VitalSigns, value: any) => {
    onChange({
      ...vitalSigns,
      [field]: value
    });
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="w-5 h-5" />
          Vital Signs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Blood Pressure</Label>
            <div className="flex items-center gap-1">
              <Input
                type="number"
                placeholder="Sys"
                value={vitalSigns?.bloodPressureSystolic || ''}
                onChange={(e) => handleChange('bloodPressureSystolic', parseInt(e.target.value) || undefined)}
                className="text-sm"
              />
              <span className="text-gray-500">/</span>
              <Input
                type="number"
                placeholder="Dia"
                value={vitalSigns?.bloodPressureDiastolic || ''}
                onChange={(e) => handleChange('bloodPressureDiastolic', parseInt(e.target.value) || undefined)}
                className="text-sm"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Heart className="w-4 h-4" />
              Heart Rate
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="bpm"
                value={vitalSigns?.heartRate || ''}
                onChange={(e) => handleChange('heartRate', parseInt(e.target.value) || undefined)}
                className="text-sm"
              />
              <span className="text-xs text-gray-500">bpm</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Thermometer className="w-4 h-4" />
              Temperature
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                placeholder="98.6"
                value={vitalSigns?.temperature || ''}
                onChange={(e) => handleChange('temperature', parseFloat(e.target.value) || undefined)}
                className="text-sm"
              />
              <select
                value={vitalSigns?.temperatureUnit || 'F'}
                onChange={(e) => handleChange('temperatureUnit', e.target.value as 'C' | 'F')}
                className="text-xs border rounded px-1 py-1"
              >
                <option value="F">°F</option>
                <option value="C">°C</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Respiratory Rate</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="16"
                value={vitalSigns?.respiratoryRate || ''}
                onChange={(e) => handleChange('respiratoryRate', parseInt(e.target.value) || undefined)}
                className="text-sm"
              />
              <span className="text-xs text-gray-500">rpm</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">O2 Saturation</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="98"
                value={vitalSigns?.oxygenSaturation || ''}
                onChange={(e) => handleChange('oxygenSaturation', parseInt(e.target.value) || undefined)}
                className="text-sm"
              />
              <span className="text-xs text-gray-500">%</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Scale className="w-4 h-4" />
              Weight
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                placeholder="150"
                value={vitalSigns?.weight || ''}
                onChange={(e) => handleChange('weight', parseFloat(e.target.value) || undefined)}
                className="text-sm"
              />
              <select
                value={vitalSigns?.weightUnit || 'lbs'}
                onChange={(e) => handleChange('weightUnit', e.target.value as 'kg' | 'lbs')}
                className="text-xs border rounded px-1 py-1"
              >
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Ruler className="w-4 h-4" />
              Height
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                placeholder="68"
                value={vitalSigns?.height || ''}
                onChange={(e) => handleChange('height', parseInt(e.target.value) || undefined)}
                className="text-sm"
              />
              <select
                value={vitalSigns?.heightUnit || 'in'}
                onChange={(e) => handleChange('heightUnit', e.target.value as 'cm' | 'in')}
                className="text-xs border rounded px-1 py-1"
              >
                <option value="in">in</option>
                <option value="cm">cm</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Zap className="w-4 h-4" />
              Pain Score
            </Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                min="0"
                max="10"
                placeholder="0"
                value={vitalSigns?.painScore || ''}
                onChange={(e) => handleChange('painScore', parseInt(e.target.value) || undefined)}
                className="text-sm"
              />
              <span className="text-xs text-gray-500">/10</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export function ClientNotes({ clientId, className }: ClientNotesProps) {
  const [filters, setFilters] = useState<NoteFilters>({});
  const [sortBy, setSortBy] = useState<'date' | 'type' | 'provider'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<ClientNote | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRevisionsDialogOpen, setIsRevisionsDialogOpen] = useState(false);
  const [templates, setTemplates] = useState<NoteTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<NoteTemplate | null>(null);

  // Form states
  const [noteForm, setNoteForm] = useState({
    type: NoteType.PROGRESS_NOTE,
    category: NoteCategory.CLINICAL,
    title: '',
    content: '',
    tags: [] as string[],
    vitalSigns: {} as VitalSigns,
    isConfidential: false
  });

  const { notes, loading, error, createNote, updateNote, deleteNote, refresh } = useClientNotes(clientId);
  const permissions = useCaregiverPermissions(clientId);
  const { toast } = useToast();

  // Load templates
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const templateList = await clientNotesService.listTemplates();
        setTemplates(templateList);
      } catch (error) {
        console.error('Failed to load templates:', error);
      }
    };

    loadTemplates();
  }, []);

  // Filter and sort notes
  const filteredNotes = useMemo(() => {
    let filtered = notes;

    // Apply filters
    if (filters.type) {
      filtered = filtered.filter(note => note.type === filters.type);
    }

    if (filters.category) {
      filtered = filtered.filter(note => note.category === filters.category);
    }

    if (filters.provider) {
      filtered = filtered.filter(note => 
        note.providerName.toLowerCase().includes(filters.provider!.toLowerCase())
      );
    }

    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(note => 
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query) ||
        note.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (filters.isLocked !== undefined) {
      filtered = filtered.filter(note => note.isLocked === filters.isLocked);
    }

    if (filters.dateRange) {
      filtered = filtered.filter(note => {
        const noteDate = parseISO(note.createdAt);
        return isWithinInterval(noteDate, filters.dateRange!);
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'type':
          aValue = a.type;
          bValue = b.type;
          break;
        case 'provider':
          aValue = a.providerName;
          bValue = b.providerName;
          break;
        default:
          return 0;
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  }, [notes, filters, sortBy, sortOrder]);

  const handleCreateNote = async () => {
    try {
      const newNote = await createNote({
        clientId,
        providerId: 'current-user', // Would get from auth context
        providerName: 'Current Provider', // Would get from auth context
        ...noteForm
      });

      toast({
        title: 'Note created',
        description: 'The note has been saved successfully',
      });

      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create note',
        variant: 'destructive',
      });
    }
  };

  const handleEditNote = async () => {
    if (!selectedNote) return;

    try {
      await updateNote(selectedNote.id, noteForm, 'Updated by user');
      
      toast({
        title: 'Note updated',
        description: 'The note has been updated successfully',
      });

      setIsEditDialogOpen(false);
      setSelectedNote(null);
      resetForm();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update note',
        variant: 'destructive',
      });
    }
  };

  const handleLockNote = async (note: ClientNote) => {
    try {
      await clientNotesService.lockNote(note.id, 'current-user');
      await refresh();
      
      toast({
        title: 'Note locked',
        description: 'The note has been locked and cannot be edited',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to lock note',
        variant: 'destructive',
      });
    }
  };

  const handleSignNote = async (note: ClientNote) => {
    try {
      await clientNotesService.signNote(note.id, 'current-user', 'Provider');
      await refresh();
      
      toast({
        title: 'Note signed',
        description: 'The note has been electronically signed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign note',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNote = async (note: ClientNote) => {
    try {
      await deleteNote(note.id, 'Deleted by user');
      
      toast({
        title: 'Note deleted',
        description: 'The note has been removed',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete note',
        variant: 'destructive',
      });
    }
  };

  const handleUseTemplate = (template: NoteTemplate) => {
    setNoteForm({
      ...noteForm,
      type: template.type,
      category: template.category,
      title: template.name,
      content: template.content
    });
    setSelectedTemplate(template);
  };

  const resetForm = () => {
    setNoteForm({
      type: NoteType.PROGRESS_NOTE,
      category: NoteCategory.CLINICAL,
      title: '',
      content: '',
      tags: [],
      vitalSigns: {},
      isConfidential: false
    });
    setSelectedTemplate(null);
  };

  const openEditDialog = (note: ClientNote) => {
    setSelectedNote(note);
    setNoteForm({
      type: note.type,
      category: note.category,
      title: note.title,
      content: note.content,
      tags: note.tags || [],
      vitalSigns: note.vitalSigns || {},
      isConfidential: note.isConfidential
    });
    setIsEditDialogOpen(true);
  };

  const getNoteTypeIcon = (type: NoteType) => {
    switch (type) {
      case NoteType.PROGRESS_NOTE:
        return <FileText className="w-4 h-4" />;
      case NoteType.LAB_RESULT:
        return <Activity className="w-4 h-4" />;
      case NoteType.NURSING_NOTE:
        return <Heart className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const getNoteTypeColor = (type: NoteType) => {
    switch (type) {
      case NoteType.PROGRESS_NOTE:
        return 'bg-blue-100 text-blue-800';
      case NoteType.LAB_RESULT:
        return 'bg-green-100 text-green-800';
      case NoteType.NURSING_NOTE:
        return 'bg-pink-100 text-pink-800';
      case NoteType.PROCEDURE_NOTE:
        return 'bg-purple-100 text-purple-800';
      case NoteType.DISCHARGE_SUMMARY:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Client Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Client Notes ({filteredNotes.length})
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refresh()}
            >
              <Clock className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            
            {permissions.canManageMedications && (
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Note
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mt-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search notes..."
              value={filters.searchQuery || ''}
              onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
              className="pl-10"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div>
                  <Label>Note Type</Label>
                  <select
                    value={filters.type || ''}
                    onChange={(e) => setFilters({ ...filters, type: e.target.value as NoteType || undefined })}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    <option value="">All Types</option>
                    {Object.values(NoteType).map(type => (
                      <option key={type} value={type}>
                        {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Category</Label>
                  <select
                    value={filters.category || ''}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value as NoteCategory || undefined })}
                    className="w-full mt-1 p-2 border rounded"
                  >
                    <option value="">All Categories</option>
                    {Object.values(NoteCategory).map(category => (
                      <option key={category} value={category}>
                        {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label>Provider</Label>
                  <Input
                    placeholder="Provider name..."
                    value={filters.provider || ''}
                    onChange={(e) => setFilters({ ...filters, provider: e.target.value || undefined })}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="locked-filter"
                    checked={filters.isLocked === true}
                    onChange={(e) => setFilters({ ...filters, isLocked: e.target.checked ? true : undefined })}
                  />
                  <Label htmlFor="locked-filter">Locked notes only</Label>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters({})}
                  className="w-full"
                >
                  Clear Filters
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                Sort: {sortBy} {sortOrder === 'asc' ? '↑' : '↓'}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setSortBy('date')}>
                Date {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('type')}>
                Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('provider')}>
                Provider {sortBy === 'provider' && (sortOrder === 'asc' ? '↑' : '↓')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
                {sortOrder === 'asc' ? 'Descending' : 'Ascending'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent>
        {filteredNotes.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500 mb-4">
              {notes.length === 0 ? 'No notes available' : 'No notes match your filters'}
            </p>
            {permissions.canManageMedications && (
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Note
              </Button>
            )}
          </div>
        ) : (
          <ScrollArea className="h-96">
            <div className="space-y-4">
              {filteredNotes.map((note) => (
                <Card key={note.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge className={`${getNoteTypeColor(note.type)} flex items-center gap-1`}>
                            {getNoteTypeIcon(note.type)}
                            {note.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </Badge>
                          
                          <h3 className="font-semibold text-lg">{note.title}</h3>
                          
                          {note.isLocked && (
                            <Lock className="w-4 h-4 text-amber-600" title="Locked" />
                          )}
                          
                          {note.isConfidential && (
                            <Eye className="w-4 h-4 text-red-600" title="Confidential" />
                          )}

                          {note.signatures && note.signatures.length > 0 && (
                            <CheckCircle className="w-4 h-4 text-green-600" title="Signed" />
                          )}
                        </div>

                        <div className="text-sm text-gray-600 mb-3 space-y-1">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {note.providerName}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(parseISO(note.createdAt), 'MMM dd, yyyy HH:mm')}
                            </span>
                            {note.version > 1 && (
                              <span className="flex items-center gap-1">
                                <History className="w-4 h-4" />
                                v{note.version}
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-gray-800 mb-3 line-clamp-3">
                          {note.content}
                        </p>

                        {note.tags && note.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {note.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {note.vitalSigns && Object.keys(note.vitalSigns).length > 0 && (
                          <div className="bg-blue-50 rounded p-2 mb-3">
                            <div className="text-xs text-blue-800 flex items-center gap-1 mb-1">
                              <Activity className="w-3 h-3" />
                              Vital Signs Recorded
                            </div>
                            <div className="text-xs text-blue-700 flex gap-3">
                              {note.vitalSigns.bloodPressureSystolic && (
                                <span>BP: {note.vitalSigns.bloodPressureSystolic}/{note.vitalSigns.bloodPressureDiastolic}</span>
                              )}
                              {note.vitalSigns.heartRate && (
                                <span>HR: {note.vitalSigns.heartRate}</span>
                              )}
                              {note.vitalSigns.temperature && (
                                <span>Temp: {note.vitalSigns.temperature}°{note.vitalSigns.temperatureUnit || 'F'}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setSelectedNote(note)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          
                          {permissions.canManageMedications && !note.isLocked && (
                            <DropdownMenuItem onClick={() => openEditDialog(note)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                          )}

                          {note.version > 1 && (
                            <DropdownMenuItem onClick={() => {
                              setSelectedNote(note);
                              setIsRevisionsDialogOpen(true);
                            }}>
                              <History className="w-4 h-4 mr-2" />
                              View Revisions
                            </DropdownMenuItem>
                          )}

                          {permissions.canManageMedications && (
                            <>
                              <DropdownMenuSeparator />
                              
                              {!note.isLocked && (
                                <DropdownMenuItem onClick={() => handleLockNote(note)}>
                                  <Lock className="w-4 h-4 mr-2" />
                                  Lock Note
                                </DropdownMenuItem>
                              )}

                              {!note.signatures?.length && (
                                <DropdownMenuItem onClick={() => handleSignNote(note)}>
                                  <PenTool className="w-4 h-4 mr-2" />
                                  Sign Note
                                </DropdownMenuItem>
                              )}

                              <DropdownMenuItem onClick={() => handleDeleteNote(note)} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      {/* Create Note Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Note</DialogTitle>
            <DialogDescription>
              Create a new client note or use a template to get started.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Template Selection */}
            {templates.length > 0 && (
              <div>
                <Label>Use Template (Optional)</Label>
                <div className="flex gap-2 mt-2 flex-wrap">
                  {templates.map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedTemplate?.id === template.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleUseTemplate(template)}
                    >
                      {template.name}
                    </Button>
                  ))}
                  {selectedTemplate && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedTemplate(null);
                        resetForm();
                      }}
                    >
                      Clear Template
                    </Button>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="note-type">Note Type</Label>
                <select
                  id="note-type"
                  value={noteForm.type}
                  onChange={(e) => setNoteForm({ ...noteForm, type: e.target.value as NoteType })}
                  className="w-full mt-1 p-2 border rounded"
                >
                  {Object.values(NoteType).map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="note-category">Category</Label>
                <select
                  id="note-category"
                  value={noteForm.category}
                  onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value as NoteCategory })}
                  className="w-full mt-1 p-2 border rounded"
                >
                  {Object.values(NoteCategory).map(category => (
                    <option key={category} value={category}>
                      {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="note-title">Title</Label>
              <Input
                id="note-title"
                value={noteForm.title}
                onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                placeholder="Enter note title..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="note-content">Content</Label>
              <Textarea
                id="note-content"
                value={noteForm.content}
                onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                placeholder="Enter note content..."
                rows={8}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="note-tags">Tags (comma-separated)</Label>
              <Input
                id="note-tags"
                value={noteForm.tags.join(', ')}
                onChange={(e) => setNoteForm({ 
                  ...noteForm, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) 
                })}
                placeholder="e.g., follow-up, medication-review, urgent"
                className="mt-1"
              />
            </div>

            {/* Vital Signs Input */}
            <VitalSignsInput
              vitalSigns={noteForm.vitalSigns}
              onChange={(vitalSigns) => setNoteForm({ ...noteForm, vitalSigns })}
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="confidential"
                checked={noteForm.isConfidential}
                onChange={(e) => setNoteForm({ ...noteForm, isConfidential: e.target.checked })}
              />
              <Label htmlFor="confidential">Mark as confidential</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateNote}
              disabled={!noteForm.title || !noteForm.content}
            >
              Create Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Note Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogDescription>
              Make changes to the note. A revision will be created to track changes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-note-type">Note Type</Label>
                <select
                  id="edit-note-type"
                  value={noteForm.type}
                  onChange={(e) => setNoteForm({ ...noteForm, type: e.target.value as NoteType })}
                  className="w-full mt-1 p-2 border rounded"
                >
                  {Object.values(NoteType).map(type => (
                    <option key={type} value={type}>
                      {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="edit-note-category">Category</Label>
                <select
                  id="edit-note-category"
                  value={noteForm.category}
                  onChange={(e) => setNoteForm({ ...noteForm, category: e.target.value as NoteCategory })}
                  className="w-full mt-1 p-2 border rounded"
                >
                  {Object.values(NoteCategory).map(category => (
                    <option key={category} value={category}>
                      {category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="edit-note-title">Title</Label>
              <Input
                id="edit-note-title"
                value={noteForm.title}
                onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                placeholder="Enter note title..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-note-content">Content</Label>
              <Textarea
                id="edit-note-content"
                value={noteForm.content}
                onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                placeholder="Enter note content..."
                rows={8}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="edit-note-tags">Tags (comma-separated)</Label>
              <Input
                id="edit-note-tags"
                value={noteForm.tags.join(', ')}
                onChange={(e) => setNoteForm({ 
                  ...noteForm, 
                  tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) 
                })}
                placeholder="e.g., follow-up, medication-review, urgent"
                className="mt-1"
              />
            </div>

            {/* Vital Signs Input */}
            <VitalSignsInput
              vitalSigns={noteForm.vitalSigns}
              onChange={(vitalSigns) => setNoteForm({ ...noteForm, vitalSigns })}
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="edit-confidential"
                checked={noteForm.isConfidential}
                onChange={(e) => setNoteForm({ ...noteForm, isConfidential: e.target.checked })}
              />
              <Label htmlFor="edit-confidential">Mark as confidential</Label>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditDialogOpen(false);
                setSelectedNote(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditNote}
              disabled={!noteForm.title || !noteForm.content}
            >
              Update Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Note Details Dialog */}
      <Dialog open={!!selectedNote && !isEditDialogOpen && !isRevisionsDialogOpen} onOpenChange={(open) => !open && setSelectedNote(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {selectedNote && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {getNoteTypeIcon(selectedNote.type)}
                  {selectedNote.title}
                </DialogTitle>
                <DialogDescription>
                  {selectedNote.providerName} • {format(parseISO(selectedNote.createdAt), 'MMM dd, yyyy HH:mm')}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={getNoteTypeColor(selectedNote.type)}>
                    {selectedNote.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                  <Badge variant="secondary">
                    {selectedNote.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Badge>
                  {selectedNote.isLocked && (
                    <Badge variant="destructive">
                      <Lock className="w-3 h-3 mr-1" />
                      Locked
                    </Badge>
                  )}
                  {selectedNote.isConfidential && (
                    <Badge variant="destructive">
                      <Eye className="w-3 h-3 mr-1" />
                      Confidential
                    </Badge>
                  )}
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="whitespace-pre-wrap">{selectedNote.content}</p>
                </div>

                {selectedNote.tags && selectedNote.tags.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Tags</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedNote.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {selectedNote.vitalSigns && Object.keys(selectedNote.vitalSigns).length > 0 && (
                  <div>
                    <Label className="text-sm font-medium flex items-center gap-1 mb-2">
                      <Activity className="w-4 h-4" />
                      Vital Signs
                    </Label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-blue-50 rounded-lg p-3">
                      {selectedNote.vitalSigns.bloodPressureSystolic && (
                        <div className="text-sm">
                          <span className="font-medium">Blood Pressure:</span>
                          <br />
                          {selectedNote.vitalSigns.bloodPressureSystolic}/{selectedNote.vitalSigns.bloodPressureDiastolic}
                        </div>
                      )}
                      {selectedNote.vitalSigns.heartRate && (
                        <div className="text-sm">
                          <span className="font-medium">Heart Rate:</span>
                          <br />
                          {selectedNote.vitalSigns.heartRate} bpm
                        </div>
                      )}
                      {selectedNote.vitalSigns.temperature && (
                        <div className="text-sm">
                          <span className="font-medium">Temperature:</span>
                          <br />
                          {selectedNote.vitalSigns.temperature}°{selectedNote.vitalSigns.temperatureUnit || 'F'}
                        </div>
                      )}
                      {selectedNote.vitalSigns.oxygenSaturation && (
                        <div className="text-sm">
                          <span className="font-medium">O2 Saturation:</span>
                          <br />
                          {selectedNote.vitalSigns.oxygenSaturation}%
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedNote.signatures && selectedNote.signatures.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Signatures</Label>
                    <div className="space-y-2 mt-1">
                      {selectedNote.signatures.map((signature) => (
                        <div key={signature.id} className="bg-green-50 rounded p-2 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="font-medium">{signature.signedBy}</span>
                            <span className="text-gray-500">({signature.role})</span>
                          </div>
                          <div className="text-xs text-gray-500 ml-6">
                            Signed {format(parseISO(signature.signedAt), 'MMM dd, yyyy HH:mm')} • {signature.signatureType}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}