/**
 * Client Notes and Documentation System
 * Manages clinical notes, progress notes, and client documentation
 */

import { generateClient } from 'aws-amplify/api';
import type { Schema } from '@/amplify/data/resource';

const client = generateClient<Schema>();

export interface ClientNote {
  id: string;
  clientId: string;
  providerId: string;
  providerName: string;
  type: NoteType;
  category: NoteCategory;
  title: string;
  content: string;
  tags?: string[];
  attachments?: NoteAttachment[];
  vitalSigns?: VitalSigns;
  medications?: string[];
  diagnoses?: string[];
  procedures?: string[];
  followUpDate?: string;
  isConfidential: boolean;
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  revisions?: NoteRevision[];
  signatures?: NoteSignature[];
}

export enum NoteType {
  PROGRESS_NOTE = 'progress_note',
  INITIAL_ASSESSMENT = 'initial_assessment',
  DISCHARGE_SUMMARY = 'discharge_summary',
  CONSULTATION = 'consultation',
  PROCEDURE_NOTE = 'procedure_note',
  NURSING_NOTE = 'nursing_note',
  THERAPY_NOTE = 'therapy_note',
  LAB_RESULT = 'lab_result',
  IMAGING_REPORT = 'imaging_report',
  MEDICATION_REVIEW = 'medication_review',
  CARE_PLAN = 'care_plan',
  REFERRAL = 'referral',
  TELEPHONE_ENCOUNTER = 'telephone_encounter',
  EMAIL_ENCOUNTER = 'email_encounter'
}

export enum NoteCategory {
  CLINICAL = 'clinical',
  ADMINISTRATIVE = 'administrative',
  BILLING = 'billing',
  LEGAL = 'legal',
  RESEARCH = 'research'
}

export interface NoteAttachment {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  url: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface VitalSigns {
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  heartRate?: number;
  temperature?: number;
  temperatureUnit?: 'C' | 'F';
  respiratoryRate?: number;
  oxygenSaturation?: number;
  weight?: number;
  weightUnit?: 'kg' | 'lbs';
  height?: number;
  heightUnit?: 'cm' | 'in';
  bmi?: number;
  painScore?: number;
}

export interface NoteRevision {
  id: string;
  noteId: string;
  content: string;
  changedBy: string;
  changedAt: string;
  changeReason?: string;
  version: number;
}

export interface NoteSignature {
  id: string;
  signedBy: string;
  signedAt: string;
  role: string;
  signatureType: 'electronic' | 'digital';
  ipAddress?: string;
}

export interface NoteTemplate {
  id: string;
  name: string;
  type: NoteType;
  category: NoteCategory;
  content: string;
  fields?: TemplateField[];
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface TemplateField {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select' | 'multiselect';
  label: string;
  required: boolean;
  options?: string[];
  defaultValue?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    message?: string;
  };
}

class ClientNotesService {
  /**
   * Create a new client note
   */
  async createNote(note: Omit<ClientNote, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<ClientNote> {
    const timestamp = new Date().toISOString();
    const newNote: ClientNote = {
      ...note,
      id: `note_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      createdAt: timestamp,
      updatedAt: timestamp,
      version: 1,
      revisions: [],
      signatures: []
    };

    // In production, this would save to the database
    // await client.models.ClientNote.create(newNote);
    
    return newNote;
  }

  /**
   * Update an existing note
   */
  async updateNote(
    noteId: string,
    updates: Partial<ClientNote>,
    changeReason?: string
  ): Promise<ClientNote> {
    // Fetch current note
    const currentNote = await this.getNote(noteId);
    
    if (!currentNote) {
      throw new Error('Note not found');
    }

    if (currentNote.isLocked) {
      throw new Error('Note is locked and cannot be edited');
    }

    // Create revision record
    const revision: NoteRevision = {
      id: `rev_${Date.now()}`,
      noteId,
      content: currentNote.content,
      changedBy: updates.providerId || currentNote.providerId,
      changedAt: new Date().toISOString(),
      changeReason,
      version: currentNote.version
    };

    // Update note
    const updatedNote: ClientNote = {
      ...currentNote,
      ...updates,
      updatedAt: new Date().toISOString(),
      version: currentNote.version + 1,
      revisions: [...(currentNote.revisions || []), revision]
    };

    // In production, this would update in the database
    // await client.models.ClientNote.update({ id: noteId }, updatedNote);

    return updatedNote;
  }

  /**
   * Get a specific note
   */
  async getNote(noteId: string): Promise<ClientNote | null> {
    // In production, fetch from database
    // const result = await client.models.ClientNote.get({ id: noteId });
    
    // Mock data for now
    return {
      id: noteId,
      clientId: 'client_123',
      providerId: 'provider_456',
      providerName: 'Dr. Smith',
      type: NoteType.PROGRESS_NOTE,
      category: NoteCategory.CLINICAL,
      title: 'Follow-up Visit',
      content: 'Client reports improvement in symptoms...',
      isConfidential: false,
      isLocked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };
  }

  /**
   * List notes for a client
   */
  async listClientNotes(
    clientId: string,
    options?: {
      type?: NoteType;
      category?: NoteCategory;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      sortBy?: 'date' | 'type' | 'provider';
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<ClientNote[]> {
    // In production, query from database with filters
    // const query = client.models.ClientNote.list({
    //   filter: { clientId: { eq: clientId } },
    //   limit: options?.limit || 50
    // });

    // Mock data for now
    return [
      {
        id: 'note_1',
        clientId,
        providerId: 'provider_456',
        providerName: 'Dr. Smith',
        type: NoteType.PROGRESS_NOTE,
        category: NoteCategory.CLINICAL,
        title: 'Initial Consultation',
        content: 'Client presents with...',
        tags: ['initial', 'consultation'],
        isConfidential: false,
        isLocked: false,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        version: 1
      },
      {
        id: 'note_2',
        clientId,
        providerId: 'provider_789',
        providerName: 'Dr. Johnson',
        type: NoteType.LAB_RESULT,
        category: NoteCategory.CLINICAL,
        title: 'Blood Test Results',
        content: 'CBC results show...',
        tags: ['lab', 'blood-test'],
        isConfidential: false,
        isLocked: true,
        lockedBy: 'provider_789',
        lockedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        version: 2
      }
    ];
  }

  /**
   * Delete a note (soft delete)
   */
  async deleteNote(noteId: string, deleteReason: string): Promise<boolean> {
    const note = await this.getNote(noteId);
    
    if (!note) {
      throw new Error('Note not found');
    }

    if (note.isLocked) {
      throw new Error('Cannot delete locked note');
    }

    // In production, mark as deleted in database
    // await client.models.ClientNote.update(
    //   { id: noteId },
    //   { isDeleted: true, deletedAt: new Date().toISOString(), deleteReason }
    // );

    return true;
  }

  /**
   * Lock a note to prevent editing
   */
  async lockNote(noteId: string, lockedBy: string): Promise<ClientNote> {
    const note = await this.getNote(noteId);
    
    if (!note) {
      throw new Error('Note not found');
    }

    if (note.isLocked) {
      throw new Error('Note is already locked');
    }

    const updatedNote = {
      ...note,
      isLocked: true,
      lockedBy,
      lockedAt: new Date().toISOString()
    };

    // In production, update in database
    // await client.models.ClientNote.update({ id: noteId }, updatedNote);

    return updatedNote;
  }

  /**
   * Sign a note electronically
   */
  async signNote(
    noteId: string,
    signedBy: string,
    role: string,
    ipAddress?: string
  ): Promise<NoteSignature> {
    const note = await this.getNote(noteId);
    
    if (!note) {
      throw new Error('Note not found');
    }

    const signature: NoteSignature = {
      id: `sig_${Date.now()}`,
      signedBy,
      signedAt: new Date().toISOString(),
      role,
      signatureType: 'electronic',
      ipAddress
    };

    // In production, add signature to note
    // await client.models.NoteSignature.create(signature);

    return signature;
  }

  /**
   * Create a note from template
   */
  async createNoteFromTemplate(
    templateId: string,
    clientId: string,
    providerId: string,
    fieldValues: Record<string, any>
  ): Promise<ClientNote> {
    const template = await this.getTemplate(templateId);
    
    if (!template) {
      throw new Error('Template not found');
    }

    // Process template content with field values
    let content = template.content;
    Object.entries(fieldValues).forEach(([field, value]) => {
      content = content.replace(`{{${field}}}`, value);
    });

    return this.createNote({
      clientId,
      providerId,
      providerName: '', // Would be fetched from provider service
      type: template.type,
      category: template.category,
      title: template.name,
      content,
      isConfidential: false,
      isLocked: false
    });
  }

  /**
   * Get a template
   */
  async getTemplate(templateId: string): Promise<NoteTemplate | null> {
    // Mock template
    return {
      id: templateId,
      name: 'Standard Progress Note',
      type: NoteType.PROGRESS_NOTE,
      category: NoteCategory.CLINICAL,
      content: 'Chief Complaint: {{chiefComplaint}}\n\nHistory: {{history}}\n\nExamination: {{examination}}\n\nAssessment: {{assessment}}\n\nPlan: {{plan}}',
      fields: [
        {
          name: 'chiefComplaint',
          type: 'text',
          label: 'Chief Complaint',
          required: true
        },
        {
          name: 'history',
          type: 'text',
          label: 'History',
          required: true
        },
        {
          name: 'examination',
          type: 'text',
          label: 'Examination',
          required: true
        },
        {
          name: 'assessment',
          type: 'text',
          label: 'Assessment',
          required: true
        },
        {
          name: 'plan',
          type: 'text',
          label: 'Plan',
          required: true
        }
      ],
      isActive: true,
      createdBy: 'admin',
      createdAt: new Date().toISOString()
    };
  }

  /**
   * List available templates
   */
  async listTemplates(type?: NoteType): Promise<NoteTemplate[]> {
    // In production, query from database
    return [
      {
        id: 'template_1',
        name: 'Standard Progress Note',
        type: NoteType.PROGRESS_NOTE,
        category: NoteCategory.CLINICAL,
        content: 'Template content...',
        isActive: true,
        createdBy: 'admin',
        createdAt: new Date().toISOString()
      },
      {
        id: 'template_2',
        name: 'Discharge Summary',
        type: NoteType.DISCHARGE_SUMMARY,
        category: NoteCategory.CLINICAL,
        content: 'Discharge template...',
        isActive: true,
        createdBy: 'admin',
        createdAt: new Date().toISOString()
      }
    ];
  }

  /**
   * Search notes
   */
  async searchNotes(
    query: string,
    filters?: {
      clientId?: string;
      providerId?: string;
      type?: NoteType;
      category?: NoteCategory;
      dateRange?: { start: Date; end: Date };
    }
  ): Promise<ClientNote[]> {
    // In production, implement full-text search
    return [];
  }

  /**
   * Export notes
   */
  async exportNotes(
    noteIds: string[],
    format: 'pdf' | 'docx' | 'txt'
  ): Promise<Blob> {
    const notes = await Promise.all(noteIds.map(id => this.getNote(id)));
    
    // Format notes for export
    let content = '';
    notes.forEach(note => {
      if (note) {
        content += `\n=== ${note.title} ===\n`;
        content += `Date: ${new Date(note.createdAt).toLocaleString()}\n`;
        content += `Provider: ${note.providerName}\n`;
        content += `Type: ${note.type}\n\n`;
        content += note.content;
        content += '\n\n---\n';
      }
    });

    // Return as text blob for now
    return new Blob([content], { type: 'text/plain' });
  }
}

// Export singleton instance
export const clientNotesService = new ClientNotesService();

/**
 * React hook for client notes
 */
export function useClientNotes(clientId?: string) {
  const [notes, setNotes] = React.useState<ClientNote[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (clientId) {
      loadNotes();
    }
  }, [clientId]);

  const loadNotes = async () => {
    if (!clientId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const clientNotes = await clientNotesService.listClientNotes(clientId);
      setNotes(clientNotes);
    } catch (err: any) {
      setError(err.message || 'Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (note: Omit<ClientNote, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
    try {
      const newNote = await clientNotesService.createNote(note);
      setNotes([newNote, ...notes]);
      return newNote;
    } catch (err: any) {
      setError(err.message || 'Failed to create note');
      throw err;
    }
  };

  const updateNote = async (noteId: string, updates: Partial<ClientNote>, reason?: string) => {
    try {
      const updatedNote = await clientNotesService.updateNote(noteId, updates, reason);
      setNotes(notes.map(n => n.id === noteId ? updatedNote : n));
      return updatedNote;
    } catch (err: any) {
      setError(err.message || 'Failed to update note');
      throw err;
    }
  };

  const deleteNote = async (noteId: string, reason: string) => {
    try {
      await clientNotesService.deleteNote(noteId, reason);
      setNotes(notes.filter(n => n.id !== noteId));
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete note');
      throw err;
    }
  };

  return {
    notes,
    loading,
    error,
    createNote,
    updateNote,
    deleteNote,
    refresh: loadNotes
  };
}

// Import React for the hook
import React from 'react';