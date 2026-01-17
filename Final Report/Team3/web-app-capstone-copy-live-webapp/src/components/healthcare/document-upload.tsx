'use client';

import React, { useState, useRef } from 'react';
import { 
  useDocumentStorage, 
  DocumentCategory, 
  type MedicalDocument 
} from '@/lib/document-storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { 
  Upload, 
  File, 
  X, 
  Download, 
  Trash2, 
  Eye,
  FileText,
  Image,
  FolderOpen,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  clientId: string;
  clientName?: string;
  onUploadComplete?: (document: MedicalDocument) => void;
}

export function DocumentUpload({ 
  clientId, 
  clientName,
  onUploadComplete 
}: DocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [category, setCategory] = useState<DocumentCategory>(DocumentCategory.OTHER);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [viewingDocument, setViewingDocument] = useState<MedicalDocument | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<MedicalDocument | null>(null);

  const {
    uploadDocument,
    downloadDocument,
    deleteDocument,
    listDocuments,
    uploading,
    uploadProgress,
    error,
    formatFileSize,
    getCategoryDisplayName,
    getFileIcon,
  } = useDocumentStorage();

  React.useEffect(() => {
    loadDocuments();
  }, [clientId]);

  const loadDocuments = async () => {
    const docs = await listDocuments(clientId);
    setDocuments(docs);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const document = await uploadDocument(
      selectedFile,
      clientId,
      category,
      {
        description,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        uploadedBy: 'current-user', // Would get from auth context
      }
    );

    if (document) {
      setDocuments([document, ...documents]);
      setSelectedFile(null);
      setDescription('');
      setTags('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onUploadComplete?.(document);
    }
  };

  const handleDelete = async () => {
    if (!deletingDocument) return;

    const success = await deleteDocument(deletingDocument.s3Key);
    if (success) {
      setDocuments(documents.filter(d => d.id !== deletingDocument.id));
      setDeletingDocument(null);
    }
  };

  const getCategoryColor = (category: DocumentCategory) => {
    const colors: Record<DocumentCategory, string> = {
      [DocumentCategory.LAB_RESULTS]: 'bg-blue-100 text-blue-800',
      [DocumentCategory.IMAGING]: 'bg-purple-100 text-purple-800',
      [DocumentCategory.PRESCRIPTION]: 'bg-green-100 text-green-800',
      [DocumentCategory.INSURANCE]: 'bg-yellow-100 text-yellow-800',
      [DocumentCategory.MEDICAL_HISTORY]: 'bg-orange-100 text-orange-800',
      [DocumentCategory.VACCINATION]: 'bg-teal-100 text-teal-800',
      [DocumentCategory.DISCHARGE_SUMMARY]: 'bg-red-100 text-red-800',
      [DocumentCategory.REFERRAL]: 'bg-indigo-100 text-indigo-800',
      [DocumentCategory.OTHER]: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Medical Document
          </CardTitle>
          <CardDescription>
            {clientName ? `Upload documents for ${clientName}` : 'Upload medical documents securely'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* File Selection */}
          <div
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              selectedFile ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.txt"
              className="hidden"
            />
            
            {selectedFile ? (
              <div className="space-y-2">
                <FileText className="h-12 w-12 mx-auto text-blue-600" />
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-gray-600">
                  {formatFileSize(selectedFile.size)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <p className="font-medium">Click to select a file</p>
                <p className="text-sm text-gray-500">
                  or drag and drop
                </p>
                <p className="text-xs text-gray-400">
                  PDF, Images, Word (max 10MB)
                </p>
              </div>
            )}
          </div>

          {selectedFile && (
            <>
              {/* Category Selection */}
              <div className="space-y-2">
                <Label htmlFor="category">Document Category</Label>
                <Select
                  value={category}
                  onValueChange={(value) => setCategory(value as DocumentCategory)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(DocumentCategory).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {getCategoryDisplayName(cat)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add any notes about this document..."
                  rows={3}
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags (Optional)</Label>
                <Input
                  id="tags"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Enter tags separated by commas"
                />
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress.percentage}%</span>
                  </div>
                  <Progress value={uploadProgress.percentage} />
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-sm">{error}</span>
                </div>
              )}

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={uploading || !selectedFile}
                className="w-full"
              >
                {uploading ? (
                  <>Uploading...</>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Document
                  </>
                )}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Documents List */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5" />
              Uploaded Documents
            </CardTitle>
            <CardDescription>
              {documents.length} document{documents.length !== 1 ? 's' : ''} on file
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getFileIcon(doc.fileType)}</span>
                    <div>
                      <p className="font-medium">{doc.fileName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={cn("text-xs", getCategoryColor(doc.category))}>
                          {getCategoryDisplayName(doc.category)}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {formatFileSize(doc.fileSize)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {doc.description && (
                        <p className="text-sm text-gray-600 mt-1">{doc.description}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewingDocument(doc)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadDocument(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingDocument(doc)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingDocument} onOpenChange={() => setDeletingDocument(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingDocument?.fileName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingDocument(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}