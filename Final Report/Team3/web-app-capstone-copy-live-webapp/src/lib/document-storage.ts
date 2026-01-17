/**
 * Medical Document Storage Service
 * Handles secure upload, storage, and retrieval of medical documents using AWS S3
 */

import { uploadData, downloadData, remove, list } from 'aws-amplify/storage';

export interface MedicalDocument {
  id: string;
  clientId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  category: DocumentCategory;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
  tags?: string[];
  s3Key: string;
  url?: string;
  metadata?: Record<string, any>;
}

export enum DocumentCategory {
  LAB_RESULTS = 'lab_results',
  IMAGING = 'imaging',
  PRESCRIPTION = 'prescription',
  INSURANCE = 'insurance',
  MEDICAL_HISTORY = 'medical_history',
  VACCINATION = 'vaccination',
  DISCHARGE_SUMMARY = 'discharge_summary',
  REFERRAL = 'referral',
  OTHER = 'other'
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

class DocumentStorageService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_FILE_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  /**
   * Upload a medical document to S3
   */
  async uploadDocument(
    file: File,
    clientId: string,
    category: DocumentCategory,
    metadata?: {
      description?: string;
      tags?: string[];
      uploadedBy: string;
    },
    onProgress?: (progress: UploadProgress) => void
  ): Promise<MedicalDocument> {
    // Validate file
    this.validateFile(file);

    // Generate unique S3 key
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const s3Key = `medical-documents/${clientId}/${category}/${timestamp}_${sanitizedFileName}`;

    try {
      // Upload to S3 with progress tracking
      const result = await uploadData({
        key: s3Key,
        data: file,
        options: {
          contentType: file.type,
          metadata: {
            clientId,
            category,
            uploadedBy: metadata?.uploadedBy || '',
            description: metadata?.description || '',
            tags: metadata?.tags?.join(',') || '',
          },
          onProgress: (event) => {
            if (onProgress && event.totalBytes) {
              onProgress({
                loaded: event.transferredBytes,
                total: event.totalBytes,
                percentage: Math.round((event.transferredBytes / event.totalBytes) * 100)
              });
            }
          },
        },
      }).result;

      // Create document record
      const document: MedicalDocument = {
        id: `doc_${timestamp}_${Math.random().toString(36).substring(7)}`,
        clientId,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        category,
        uploadedBy: metadata?.uploadedBy || '',
        uploadedAt: new Date().toISOString(),
        description: metadata?.description,
        tags: metadata?.tags,
        s3Key,
        metadata: {
          originalName: file.name,
          lastModified: file.lastModified,
        },
      };

      return document;
    } catch (error) {
      console.error('Document upload failed:', error);
      throw new Error('Failed to upload document. Please try again.');
    }
  }

  /**
   * Download a document from S3
   */
  async downloadDocument(document: MedicalDocument): Promise<Blob> {
    try {
      const result = await downloadData({
        key: document.s3Key,
      }).result;

      return result.body as Blob;
    } catch (error) {
      console.error('Document download failed:', error);
      throw new Error('Failed to download document. Please try again.');
    }
  }

  /**
   * Get a temporary signed URL for document access
   */
  async getDocumentUrl(s3Key: string, expiresIn: number = 3600): Promise<string> {
    try {
      // In production, this would generate a signed URL
      // For now, return a mock URL
      return `https://s3.amazonaws.com/medical-documents/${s3Key}?expires=${Date.now() + expiresIn * 1000}`;
    } catch (error) {
      console.error('Failed to generate document URL:', error);
      throw new Error('Failed to access document.');
    }
  }

  /**
   * Delete a document from S3
   */
  async deleteDocument(s3Key: string): Promise<void> {
    try {
      await remove({ key: s3Key });
    } catch (error) {
      console.error('Document deletion failed:', error);
      throw new Error('Failed to delete document.');
    }
  }

  /**
   * List documents for a client
   */
  async listDocuments(
    clientId: string,
    category?: DocumentCategory
  ): Promise<MedicalDocument[]> {
    try {
      const prefix = category 
        ? `medical-documents/${clientId}/${category}/`
        : `medical-documents/${clientId}/`;

      const result = await list({
        prefix,
        options: {
          listAll: true,
        },
      });

      // Map S3 objects to document records
      const documents: MedicalDocument[] = result.items.map(item => ({
        id: `doc_${item.eTag}`,
        clientId,
        fileName: item.key?.split('/').pop() || '',
        fileType: 'application/octet-stream', // Would be stored in metadata
        fileSize: item.size || 0,
        category: this.extractCategoryFromKey(item.key || ''),
        uploadedBy: '', // Would be stored in metadata
        uploadedAt: item.lastModified?.toISOString() || '',
        s3Key: item.key || '',
      }));

      return documents;
    } catch (error) {
      console.error('Failed to list documents:', error);
      return [];
    }
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): void {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    // Check file type
    if (!this.ALLOWED_FILE_TYPES.includes(file.type)) {
      throw new Error('File type not allowed. Please upload PDF, images, or Word documents.');
    }

    // Check for potentially malicious files
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
    const fileName = file.name.toLowerCase();
    
    if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
      throw new Error('File type not allowed for security reasons.');
    }
  }

  /**
   * Extract category from S3 key
   */
  private extractCategoryFromKey(key: string): DocumentCategory {
    const parts = key.split('/');
    if (parts.length >= 3) {
      return parts[2] as DocumentCategory;
    }
    return DocumentCategory.OTHER;
  }

  /**
   * Get category display name
   */
  getCategoryDisplayName(category: DocumentCategory): string {
    const displayNames: Record<DocumentCategory, string> = {
      [DocumentCategory.LAB_RESULTS]: 'Lab Results',
      [DocumentCategory.IMAGING]: 'Imaging',
      [DocumentCategory.PRESCRIPTION]: 'Prescriptions',
      [DocumentCategory.INSURANCE]: 'Insurance',
      [DocumentCategory.MEDICAL_HISTORY]: 'Medical History',
      [DocumentCategory.VACCINATION]: 'Vaccination Records',
      [DocumentCategory.DISCHARGE_SUMMARY]: 'Discharge Summaries',
      [DocumentCategory.REFERRAL]: 'Referrals',
      [DocumentCategory.OTHER]: 'Other Documents',
    };
    return displayNames[category] || 'Documents';
  }

  /**
   * Get file icon based on type
   */
  getFileIcon(fileType: string): string {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('word')) return '📝';
    if (fileType.includes('text')) return '📃';
    return '📎';
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// Export singleton instance
export const documentStorageService = new DocumentStorageService();

/**
 * React hook for document storage
 */
export function useDocumentStorage() {
  const [uploading, setUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
  });
  const [error, setError] = React.useState<string | null>(null);

  const uploadDocument = async (
    file: File,
    clientId: string,
    category: DocumentCategory,
    metadata?: {
      description?: string;
      tags?: string[];
      uploadedBy: string;
    }
  ): Promise<MedicalDocument | null> => {
    setUploading(true);
    setError(null);
    setUploadProgress({ loaded: 0, total: 0, percentage: 0 });

    try {
      const document = await documentStorageService.uploadDocument(
        file,
        clientId,
        category,
        metadata,
        (progress) => setUploadProgress(progress)
      );
      
      return document;
    } catch (err: any) {
      setError(err.message || 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const downloadDocument = async (document: MedicalDocument): Promise<void> => {
    try {
      const blob = await documentStorageService.downloadDocument(document);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      setError(err.message || 'Download failed');
    }
  };

  const deleteDocument = async (s3Key: string): Promise<boolean> => {
    try {
      await documentStorageService.deleteDocument(s3Key);
      return true;
    } catch (err: any) {
      setError(err.message || 'Delete failed');
      return false;
    }
  };

  const listDocuments = async (
    clientId: string,
    category?: DocumentCategory
  ): Promise<MedicalDocument[]> => {
    try {
      return await documentStorageService.listDocuments(clientId, category);
    } catch (err: any) {
      setError(err.message || 'Failed to list documents');
      return [];
    }
  };

  return {
    uploadDocument,
    downloadDocument,
    deleteDocument,
    listDocuments,
    uploading,
    uploadProgress,
    error,
    formatFileSize: documentStorageService.formatFileSize,
    getCategoryDisplayName: documentStorageService.getCategoryDisplayName,
    getFileIcon: documentStorageService.getFileIcon,
  };
}

// Import React for the hook
import React from 'react';