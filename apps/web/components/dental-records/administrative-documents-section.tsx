'use client';

/**
 * Administrative Documents Section
 * Consent forms, invoices, treatment plans, insurance claims, and other documents
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  Download,
  Eye,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileSignature,
  DollarSign,
  ClipboardList,
  FileCheck,
  Pill,
  SendHorizontal,
  Plus,
  Trash2,
  Edit,
  Calendar,
  User,
  X,
} from 'lucide-react';
import type { AdministrativeDocuments, AdministrativeDocument } from '@/lib/types/dental-record';

interface AdminDocumentsSectionProps {
  patientId: string;
  adminDocuments: AdministrativeDocuments;
  onUpdate?: (updates: Partial<AdministrativeDocuments>) => void;
}

export default function AdminDocumentsSection({
  patientId,
  adminDocuments,
  onUpdate,
}: AdminDocumentsSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDocument, setSelectedDocument] = useState<AdministrativeDocument | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Document categories
  const categories = [
    { id: 'all', label: 'All Documents', icon: FileText, count: adminDocuments.documents.length },
    {
      id: 'consent_form',
      label: 'Consent Forms',
      icon: FileSignature,
      count: adminDocuments.documents.filter(d => d.document_type === 'consent_form').length,
    },
    {
      id: 'treatment_plan',
      label: 'Treatment Plans',
      icon: ClipboardList,
      count: adminDocuments.documents.filter(d => d.document_type === 'treatment_plan').length,
    },
    {
      id: 'invoice',
      label: 'Invoices',
      icon: DollarSign,
      count: adminDocuments.documents.filter(d => d.document_type === 'invoice').length,
    },
    {
      id: 'insurance_claim',
      label: 'Insurance Claims',
      icon: FileCheck,
      count: adminDocuments.documents.filter(d => d.document_type === 'insurance_claim').length,
    },
    {
      id: 'prescription',
      label: 'Prescriptions',
      icon: Pill,
      count: adminDocuments.documents.filter(d => d.document_type === 'prescription').length,
    },
    {
      id: 'referral_letter',
      label: 'Referral Letters',
      icon: SendHorizontal,
      count: adminDocuments.documents.filter(d => d.document_type === 'referral_letter').length,
    },
  ];

  // Filter documents
  const filteredDocuments = adminDocuments.documents.filter(doc => {
    const matchesCategory = selectedCategory === 'all' || doc.document_type === selectedCategory;
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Status configurations
  const statusConfig = {
    pending: {
      color: 'text-yellow-700 bg-yellow-100 border-yellow-300',
      icon: Clock,
      label: 'Pending',
    },
    signed: {
      color: 'text-green-700 bg-green-100 border-green-300',
      icon: CheckCircle2,
      label: 'Signed',
    },
    approved: {
      color: 'text-blue-700 bg-blue-100 border-blue-300',
      icon: CheckCircle2,
      label: 'Approved',
    },
    rejected: {
      color: 'text-red-700 bg-red-100 border-red-300',
      icon: AlertCircle,
      label: 'Rejected',
    },
    archived: {
      color: 'text-gray-700 bg-gray-100 border-gray-300',
      icon: FileText,
      label: 'Archived',
    },
    void: {
      color: 'text-gray-700 bg-gray-100 border-gray-300',
      icon: AlertCircle,
      label: 'Void',
    },
  };

  // Get category icon
  const getCategoryIcon = (type: string) => {
    const category = categories.find(c => c.id === type);
    return category?.icon || FileText;
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Documents</p>
              <p className="text-2xl font-bold text-blue-600">{adminDocuments.documents.length}</p>
            </div>
            <FileText className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">
                {adminDocuments.documents.filter(d => d.status === 'pending').length}
              </p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Signed</p>
              <p className="text-2xl font-bold text-green-600">
                {adminDocuments.documents.filter(d => d.status === 'signed').length}
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Need Attention</p>
              <p className="text-2xl font-bold text-red-600">
                {adminDocuments.documents.filter(d => d.status === 'rejected').length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-sm overflow-x-auto">
        <div className="flex space-x-2 min-w-max">
          {categories.map(category => {
            const Icon = category.icon;
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === category.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{category.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  selectedCategory === category.id ? 'bg-blue-600' : 'bg-gray-200'
                }`}>
                  {category.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence mode="popLayout">
          {filteredDocuments.map(doc => {
            const Icon = getCategoryIcon(doc.document_type);
            const statusInfo = statusConfig[doc.status];
            const StatusIcon = statusInfo.icon;

            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">
                        {doc.title}
                      </h3>
                    </div>
                  </div>
                </div>

                {doc.notes && (
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2">{doc.notes}</p>
                )}

                <div className="flex items-center justify-between mb-3">
                  <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium border ${statusInfo.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span>{statusInfo.label}</span>
                  </span>
                  <span className="text-xs text-gray-500">{doc.file_format.toUpperCase()}</span>
                </div>

                <div className="space-y-1.5 mb-4 text-xs text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-3 h-3" />
                    <span>Issued: {new Date(doc.date_issued).toLocaleDateString()}</span>
                  </div>
                  {doc.linked_procedure && (
                    <div className="flex items-center space-x-2">
                      <ClipboardList className="w-3 h-3" />
                      <span>Procedure: {doc.linked_procedure}</span>
                    </div>
                  )}
                </div>

                {doc.signed_by && doc.signed_by.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-2 mb-3">
                    <div className="flex items-center space-x-2 text-xs text-green-700">
                      <FileSignature className="w-3 h-3" />
                      <span>Signed by {doc.signed_by[0].signer_name}</span>
                    </div>
                    <p className="text-xs text-green-600 mt-0.5">
                      {new Date(doc.signed_by[0].signature_date).toLocaleDateString()}
                    </p>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSelectedDocument(doc)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View</span>
                  </button>
                  <button className="flex items-center justify-center px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors">
                    <Download className="w-3 h-3" />
                  </button>
                  <button className="flex items-center justify-center px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors">
                    <Edit className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredDocuments.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No documents found</h3>
          <p className="text-gray-500 mb-6">Try adjusting your filters or upload a new document</p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Upload className="w-5 h-5" />
            <span>Upload Document</span>
          </button>
        </div>
      )}

      {/* Document Preview Modal */}
      <AnimatePresence>
        {selectedDocument && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedDocument(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="border-b border-gray-200 p-6 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const Icon = getCategoryIcon(selectedDocument.document_type);
                    return (
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Icon className="w-6 h-6 text-blue-600" />
                      </div>
                    );
                  })()}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedDocument.title}</h2>
                    {selectedDocument.notes && (
                      <p className="text-sm text-gray-600">{selectedDocument.notes}</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                <div className="space-y-4">
                  {/* Document Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-1">Document Type</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {selectedDocument.document_type.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-1">Status</p>
                      <p className="text-sm font-medium text-gray-900 capitalize">
                        {selectedDocument.status.replace('_', ' ')}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-1">Upload Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {new Date(selectedDocument.date_issued).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-1">File Format</p>
                      <p className="text-sm font-medium text-gray-900">{selectedDocument.file_format.toUpperCase()}</p>
                    </div>
                  </div>

                  {/* Signature Info */}
                  {selectedDocument.signed_by && selectedDocument.signed_by.length > 0 && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <FileSignature className="w-5 h-5 text-green-600" />
                        <h3 className="font-semibold text-green-900">Document Signed</h3>
                      </div>
                      <div className="space-y-1 text-sm text-green-700">
                        <p>Signed by: <span className="font-medium">{selectedDocument.signed_by[0].signer_name}</span></p>
                        <p>Role: <span className="font-medium capitalize">{selectedDocument.signed_by[0].signer_role}</span></p>
                        <p>Date: <span className="font-medium">
                          {new Date(selectedDocument.signed_by[0].signature_date).toLocaleDateString()}
                        </span></p>
                      </div>
                    </div>
                  )}

                  {/* Document Preview Placeholder */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium mb-2">Document Preview</p>
                    <p className="text-sm text-gray-500">
                      {selectedDocument.file_format.toUpperCase()} file viewer will be displayed here
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="border-t border-gray-200 p-6 flex items-center justify-between">
                <button
                  onClick={() => setSelectedDocument(null)}
                  className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
                <div className="flex items-center space-x-3">
                  <button className="flex items-center space-x-2 px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                    <Download className="w-4 h-4" />
                    <span>Download</span>
                  </button>
                  {selectedDocument.status === 'pending' && (
                    <button className="flex items-center space-x-2 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                      <FileSignature className="w-4 h-4" />
                      <span>Sign Document</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Upload Modal Placeholder */}
      <AnimatePresence>
        {showUploadModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowUploadModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Upload New Document</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-6">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">Drag & Drop files here</p>
                <p className="text-sm text-gray-500 mb-4">or click to browse</p>
                <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Select Files
                </button>
              </div>

              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                  Upload
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
