'use client';

/**
 * Radiographic & Diagnostic Files Section
 * X-ray gallery with lightbox viewer, zoom/pan, AI analysis overlay
 * Supports: Bitewing, Periapical, Panoramic, CBCT, Intraoral Photos
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Download,
  X,
  ChevronLeft,
  ChevronRight,
  Upload,
  Filter,
  Calendar,
  User,
  FileText,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import type { RadiographicRecord } from '@/lib/types/dental-record';

interface RadiographicFilesSectionProps {
  patientId: string;
  radiographicRecords: RadiographicRecord[];
  onUpload?: (file: File) => void;
}

type FileTypeFilter = 'all' | 'bitewing' | 'periapical' | 'panoramic' | 'cbct' | 'occlusal' | 'cephalometric' | 'intraoral_photo';

export default function RadiographicFilesSection({
  patientId,
  radiographicRecords,
  onUpload,
}: RadiographicFilesSectionProps) {
  const [selectedImage, setSelectedImage] = useState<RadiographicRecord | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showAIOverlay, setShowAIOverlay] = useState(false);
  const [filterType, setFilterType] = useState<FileTypeFilter>('all');
  const [isUploading, setIsUploading] = useState(false);

  // Filter records by type
  const filteredRecords = filterType === 'all'
    ? radiographicRecords
    : radiographicRecords.filter(r => r.type === filterType);

  // Type labels for UI
  const typeLabels: Record<string, string> = {
    bitewing: 'Bitewing',
    periapical: 'Periapical',
    panoramic: 'Panoramic',
    cbct: 'CBCT',
    occlusal: 'Occlusal',
    cephalometric: 'Cephalometric',
    intraoral_photo: 'Intraoral Photo',
  };

  // Type colors
  const typeColors: Record<string, string> = {
    bitewing: 'bg-blue-100 text-blue-700',
    periapical: 'bg-green-100 text-green-700',
    panoramic: 'bg-purple-100 text-purple-700',
    cbct: 'bg-orange-100 text-orange-700',
    occlusal: 'bg-pink-100 text-pink-700',
    cephalometric: 'bg-indigo-100 text-indigo-700',
    intraoral_photo: 'bg-teal-100 text-teal-700',
  };

  // Handle image click
  const handleImageClick = (record: RadiographicRecord, index: number) => {
    setSelectedImage(record);
    setCurrentIndex(index);
    setZoomLevel(1);
    setShowAIOverlay(false);
  };

  // Handle close lightbox
  const handleClose = () => {
    setSelectedImage(null);
    setZoomLevel(1);
    setShowAIOverlay(false);
  };

  // Navigate to previous image
  const handlePrevious = () => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setSelectedImage(filteredRecords[newIndex]);
      setZoomLevel(1);
      setShowAIOverlay(false);
    }
  };

  // Navigate to next image
  const handleNext = () => {
    if (currentIndex < filteredRecords.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setSelectedImage(filteredRecords[newIndex]);
      setZoomLevel(1);
      setShowAIOverlay(false);
    }
  };

  // Handle zoom in
  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.25, 3));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  };

  // Handle download
  const handleDownload = (imageUrl: string, fileName: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    link.click();
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUpload) return;

    setIsUploading(true);
    try {
      await onUpload(file);
      // In real implementation, this would upload to server and refresh the list
    } finally {
      setIsUploading(false);
    }
  };

  // Calculate stats
  const stats = {
    total: radiographicRecords.length,
    bitewing: radiographicRecords.filter(r => r.type === 'bitewing').length,
    periapical: radiographicRecords.filter(r => r.type === 'periapical').length,
    panoramic: radiographicRecords.filter(r => r.type === 'panoramic').length,
    withAI: radiographicRecords.filter(r => r.ai_analysis).length,
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Radiographic & Diagnostic Files</h2>
          <p className="text-sm text-gray-600 mt-1">
            {stats.total} images • {stats.withAI} with AI analysis
          </p>
        </div>

        {/* Upload Button */}
        <label className="cursor-pointer">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            <span className="font-medium">{isUploading ? 'Uploading...' : 'Upload X-ray'}</span>
          </motion.div>
        </label>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-1">
            <ImageIcon className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Bitewing</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">{stats.bitewing}</p>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-1">
            <ImageIcon className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Periapical</span>
          </div>
          <p className="text-2xl font-bold text-green-600">{stats.periapical}</p>
        </div>

        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-1">
            <ImageIcon className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Panoramic</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.panoramic}</p>
        </div>

        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-1">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-indigo-900">AI Analyzed</span>
          </div>
          <p className="text-2xl font-bold text-indigo-600">{stats.withAI}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto">
        <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        {(['all', 'bitewing', 'periapical', 'panoramic', 'cbct', 'intraoral_photo'] as FileTypeFilter[]).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex-shrink-0 ${
              filterType === type
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {type === 'all' ? 'All Images' : typeLabels[type]}
            {type !== 'all' && (
              <span className="ml-2 text-xs opacity-75">
                ({radiographicRecords.filter(r => r.type === type).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Image Gallery */}
      {filteredRecords.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No X-rays Found</h3>
          <p className="text-gray-600 mb-4">
            {filterType === 'all' 
              ? 'Upload your first X-ray to get started'
              : `No ${typeLabels[filterType]} images found`
            }
          </p>
          <label className="cursor-pointer inline-block">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <span className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors inline-block">
              Upload X-ray
            </span>
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredRecords.map((record, index) => (
            <motion.div
              key={record.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleImageClick(record, index)}
              className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200"
            >
              {/* Image */}
              <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                <img
                  src={record.file_url}
                  alt={`${typeLabels[record.type]} - ${record.date_taken}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
                
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-200 flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                </div>

                {/* AI Badge */}
                {record.ai_analysis && (
                  <div className="absolute top-2 right-2 bg-indigo-600 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                    <Sparkles className="w-3 h-3" />
                    <span>AI</span>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[record.type]}`}>
                    {typeLabels[record.type]}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(record.date_taken).toLocaleDateString()}
                  </span>
                </div>

                {/* Dentist Notes */}
                {record.dentist_notes && (
                  <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                    {record.dentist_notes}
                  </p>
                )}

                {/* AI Analysis Preview */}
                {record.ai_analysis && record.ai_analysis.detected_issues.length > 0 && (
                  <div className="flex items-start space-x-2 text-xs text-amber-700 bg-amber-50 rounded p-2">
                    <AlertCircle className="w-3 h-3 flex-shrink-0 mt-0.5" />
                    <span className="line-clamp-1">
                      {record.ai_analysis.detected_issues.length} issue{record.ai_analysis.detected_issues.length !== 1 ? 's' : ''} detected
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox Viewer */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={handleClose}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Navigation Arrows */}
            {currentIndex > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
              >
                <ChevronLeft className="w-12 h-12" />
              </button>
            )}

            {currentIndex < filteredRecords.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
              >
                <ChevronRight className="w-12 h-12" />
              </button>
            )}

            {/* Toolbar */}
            <div className="absolute top-4 left-4 flex items-center space-x-4 z-10">
              {/* Zoom Controls */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomOut();
                  }}
                  className="text-white hover:text-gray-300 transition-colors"
                  disabled={zoomLevel <= 0.5}
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <span className="text-white font-medium w-12 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomIn();
                  }}
                  className="text-white hover:text-gray-300 transition-colors"
                  disabled={zoomLevel >= 3}
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>

              {/* AI Overlay Toggle */}
              {selectedImage.ai_analysis && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowAIOverlay(!showAIOverlay);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                    showAIOverlay
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>AI Analysis</span>
                </button>
              )}

              {/* Download Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(
                    selectedImage.file_url,
                    `${typeLabels[selectedImage.type]}_${selectedImage.date_taken}.jpg`
                  );
                }}
                className="bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 transition-colors rounded-lg px-4 py-2 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span className="font-medium">Download</span>
              </button>
            </div>

            {/* Image Counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-lg">
              {currentIndex + 1} / {filteredRecords.length}
            </div>

            {/* Main Image Container */}
            <div
              className="relative max-w-7xl max-h-[80vh] mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.img
                key={selectedImage.id}
                src={selectedImage.file_url}
                alt={typeLabels[selectedImage.type]}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: zoomLevel, opacity: 1 }}
                transition={{ duration: 0.2 }}
                className="max-w-full max-h-[80vh] object-contain"
                style={{ transformOrigin: 'center center' }}
              />

              {/* AI Analysis Overlay */}
              {showAIOverlay && selectedImage.ai_analysis && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute top-4 right-4 bg-white rounded-lg shadow-xl p-4 max-w-md max-h-96 overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Sparkles className="w-5 h-5 text-indigo-600 mr-2" />
                    AI Analysis Results
                  </h3>

                  {/* Summary */}
                  <div className="bg-indigo-50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-indigo-900">
                      {selectedImage.ai_analysis.summary}
                    </p>
                  </div>

                  {/* Detected Issues */}
                  {selectedImage.ai_analysis.detected_issues.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Detected Issues:</h4>
                      {selectedImage.ai_analysis.detected_issues.map((issue, idx) => (
                        <div
                          key={idx}
                          className={`rounded-lg p-3 ${
                            issue.type === 'cavity'
                              ? 'bg-red-50 border border-red-200'
                              : 'bg-amber-50 border border-amber-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center space-x-2">
                              <AlertCircle className={`w-4 h-4 ${
                                issue.type === 'cavity' ? 'text-red-600' : 'text-amber-600'
                              }`} />
                              <span className={`text-sm font-medium capitalize ${
                                issue.type === 'cavity' ? 'text-red-900' : 'text-amber-900'
                              }`}>
                                {issue.type.replace('_', ' ')}
                              </span>
                            </div>
                            <span className="text-xs font-medium text-gray-600">
                              {Math.round(issue.confidence_score * 100)}% confidence
                            </span>
                          </div>
                          <p className={`text-sm ${
                            issue.type === 'cavity' ? 'text-red-800' : 'text-amber-800'
                          }`}>
                            {issue.location}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedImage.ai_analysis.detected_issues.length === 0 && (
                    <div className="bg-green-50 rounded-lg p-3 flex items-start space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-green-900">
                        No issues detected. X-ray appears healthy.
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            {/* Image Info Panel */}
            <div
              className="absolute bottom-20 left-4 bg-white/10 backdrop-blur-sm text-white rounded-lg p-4 max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center space-x-2 mb-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedImage.type === 'bitewing' ? 'bg-blue-600' :
                  selectedImage.type === 'periapical' ? 'bg-green-600' :
                  selectedImage.type === 'panoramic' ? 'bg-purple-600' :
                  'bg-orange-600'
                }`}>
                  {typeLabels[selectedImage.type]}
                </span>
                <span className="text-sm flex items-center">
                  <Calendar className="w-3 h-3 mr-1" />
                  {new Date(selectedImage.date_taken).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>

              {selectedImage.dentist_notes && (
                <div className="flex items-start space-x-2 mb-2">
                  <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{selectedImage.dentist_notes}</p>
                </div>
              )}

              {selectedImage.metadata && (
                <div className="text-xs text-white/70 flex items-center space-x-3 mt-2 pt-2 border-t border-white/20">
                  {selectedImage.metadata.equipment && (
                    <span>Equipment: {selectedImage.metadata.equipment}</span>
                  )}
                  {selectedImage.metadata.file_size_mb && (
                    <span>Size: {selectedImage.metadata.file_size_mb.toFixed(1)} MB</span>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
