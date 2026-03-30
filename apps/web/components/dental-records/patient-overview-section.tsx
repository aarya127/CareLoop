'use client';

/**
 * Patient Overview Section
 * Displays demographics, insurance, financial info with inline editing
 * Premium Apple-like design with smooth animations
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Shield,
  Edit2,
  X,
  Save,
  DollarSign,
  Clock,
  FileText,
  AlertCircle,
  Check,
  UserCheck,
  PhoneCall,
  MessageSquare,
} from 'lucide-react';
import type { PatientProfile } from '@/lib/types/dental-record';
import { format, differenceInYears, parseISO } from 'date-fns';

interface PatientOverviewProps {
  profile: PatientProfile;
  onUpdate: (updates: Partial<PatientProfile>) => Promise<void>;
  onCall?: (phone: string) => void;
  onEmail?: (email: string) => void;
  onMessage?: (patientId: string) => void;
}

export default function PatientOverview({
  profile,
  onUpdate,
  onCall,
  onEmail,
  onMessage,
}: PatientOverviewProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);
  const [showInsuranceCard, setShowInsuranceCard] = useState(false);

  // Calculate age
  const age = profile.date_of_birth
    ? differenceInYears(new Date(), parseISO(profile.date_of_birth))
    : profile.age || 0;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(editedProfile);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      {/* Header with Quick Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            {profile.profile_photo_url ? (
              <img
                src={profile.profile_photo_url}
                alt={`${profile.first_name} ${profile.last_name}`}
                className="w-24 h-24 rounded-full object-cover ring-4 ring-[#87CEEB]/20"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#87CEEB] to-[#6BA8D9] flex items-center justify-center text-white text-3xl font-semibold ring-4 ring-[#87CEEB]/20">
                {profile.first_name[0]}
                {profile.last_name[0]}
              </div>
            )}
            <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-white" />
          </motion.div>

          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {profile.first_name} {profile.last_name}
            </h2>
            <div className="flex items-center space-x-4 mt-1 text-gray-600">
              <span className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">
                  {age} years old • Born {format(parseISO(profile.date_of_birth), 'MMM d, yyyy')}
                </span>
              </span>
              <span className="text-sm capitalize">{profile.gender}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {onCall && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onCall(profile.contact.phone)}
              className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors shadow-lg"
              title="Call patient"
            >
              <PhoneCall className="w-5 h-5" />
            </motion.button>
          )}
          {onEmail && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onEmail(profile.contact.email)}
              className="p-3 bg-[#87CEEB] text-white rounded-xl hover:bg-[#6BA8D9] transition-colors shadow-lg"
              title="Email patient"
            >
              <Mail className="w-5 h-5" />
            </motion.button>
          )}
          {onMessage && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onMessage(profile.patient_id)}
              className="p-3 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition-colors shadow-lg"
              title="Send message"
            >
              <MessageSquare className="w-5 h-5" />
            </motion.button>
          )}
          {!isEditing ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsEditing(true)}
              className="flex items-center space-x-2 px-4 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-lg"
            >
              <Edit2 className="w-4 h-4" />
              <span>Edit Info</span>
            </motion.button>
          ) : (
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCancel}
                disabled={isSaving}
                className="p-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center space-x-2 px-4 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </motion.button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <User className="w-5 h-5 text-[#87CEEB]" />
            <span>Contact Information</span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Email</p>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedProfile.contact.email}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        contact: { ...editedProfile.contact, email: e.target.value },
                      })
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#87CEEB]"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{profile.contact.email}</p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Phone</p>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedProfile.contact.phone}
                    onChange={(e) =>
                      setEditedProfile({
                        ...editedProfile,
                        contact: { ...editedProfile.contact, phone: e.target.value },
                      })
                    }
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#87CEEB]"
                  />
                ) : (
                  <p className="text-gray-900 font-medium">{profile.contact.phone}</p>
                )}
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-gray-500">Address</p>
                {isEditing ? (
                  <div className="space-y-2 mt-1">
                    <input
                      type="text"
                      placeholder="Street"
                      value={editedProfile.contact.address.street}
                      onChange={(e) =>
                        setEditedProfile({
                          ...editedProfile,
                          contact: {
                            ...editedProfile.contact,
                            address: { ...editedProfile.contact.address, street: e.target.value },
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#87CEEB]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="City"
                        value={editedProfile.contact.address.city}
                        onChange={(e) =>
                          setEditedProfile({
                            ...editedProfile,
                            contact: {
                              ...editedProfile.contact,
                              address: { ...editedProfile.contact.address, city: e.target.value },
                            },
                          })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#87CEEB]"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={editedProfile.contact.address.state}
                        onChange={(e) =>
                          setEditedProfile({
                            ...editedProfile,
                            contact: {
                              ...editedProfile.contact,
                              address: { ...editedProfile.contact.address, state: e.target.value },
                            },
                          })
                        }
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#87CEEB]"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-900">
                    {profile.contact.address.street}
                    <br />
                    {profile.contact.address.city}, {profile.contact.address.state}{' '}
                    {profile.contact.address.postal_code}
                  </p>
                )}
              </div>
            </div>

            {profile.contact.emergency_contact && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Emergency Contact</p>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>
                    <span className="font-medium">{profile.contact.emergency_contact.name}</span> (
                    {profile.contact.emergency_contact.relationship})
                  </p>
                  <p>{profile.contact.emergency_contact.phone}</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Preferences & Providers */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-[#87CEEB]" />
            <span>Preferences & Providers</span>
          </h3>

          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Preferred Dentist</p>
              <p className="text-gray-900 font-medium mt-1">
                {profile.preferences.preferred_dentist_name || 'Not specified'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Preferred Hygienist</p>
              <p className="text-gray-900 font-medium mt-1">
                {profile.preferences.preferred_hygienist_name || 'Not specified'}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Appointment Reminders</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className="px-3 py-1 bg-[#87CEEB]/10 text-[#87CEEB] rounded-full text-sm font-medium capitalize">
                  {profile.preferences.appointment_reminder_method}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Communication Language</p>
              <p className="text-gray-900 font-medium mt-1">
                {profile.preferences.communication_language}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Insurance Information */}
        {profile.insurance && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-[#87CEEB]/10 to-[#6BA8D9]/10 rounded-2xl border border-[#87CEEB]/30 p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-[#87CEEB]" />
              <span>Insurance Coverage</span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Provider</p>
                  <p className="text-gray-900 font-semibold text-lg">
                    {profile.insurance.provider_name}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Coverage</p>
                  <p className="text-[#87CEEB] font-bold text-2xl">
                    {profile.insurance.coverage_percent}%
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Policy Number</p>
                  <p className="text-gray-900 font-medium mt-1">{profile.insurance.policy_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Plan ID</p>
                  <p className="text-gray-900 font-medium mt-1">{profile.insurance.plan_id}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Coverage Type</p>
                <span className="inline-block mt-1 px-3 py-1 bg-[#87CEEB] text-white rounded-full text-sm font-medium capitalize">
                  {profile.insurance.coverage_type}
                </span>
              </div>

              {(profile.insurance.insurance_card_front_url ||
                profile.insurance.insurance_card_back_url) && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowInsuranceCard(true)}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-[#87CEEB] text-[#87CEEB] rounded-xl hover:bg-[#87CEEB]/5 transition-colors font-medium"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>View Insurance Card</span>
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* Financial Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-[#87CEEB]" />
            <span>Financial Summary</span>
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
              <div>
                <p className="text-sm text-red-600">Outstanding Balance</p>
                <p className="text-red-700 font-bold text-2xl">
                  ${profile.financial.outstanding_balance.toFixed(2)}
                </p>
              </div>
              {profile.financial.outstanding_balance > 0 && (
                <AlertCircle className="w-8 h-8 text-red-500" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Lifetime Spent</p>
                <p className="text-gray-900 font-semibold text-lg">
                  ${profile.financial.total_lifetime_spent.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Average Visit Cost</p>
                <p className="text-gray-900 font-semibold text-lg">
                  ${profile.financial.average_visit_cost.toFixed(2)}
                </p>
              </div>
            </div>

            {profile.financial.payment_plan_active && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm font-medium text-blue-900 flex items-center space-x-2">
                  <Check className="w-4 h-4" />
                  <span>Active Payment Plan</span>
                </p>
                {profile.financial.payment_plan_details && (
                  <p className="text-sm text-blue-700 mt-1">
                    {profile.financial.payment_plan_details}
                  </p>
                )}
              </div>
            )}

            {profile.financial.last_payment_date && (
              <div className="text-sm text-gray-600">
                <p>
                  Last payment: ${profile.financial.last_payment_amount?.toFixed(2)} on{' '}
                  {format(parseISO(profile.financial.last_payment_date), 'MMM d, yyyy')}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Next Appointment */}
        {profile.next_appointment && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200 p-6 shadow-sm hover:shadow-md transition-shadow lg:col-span-2"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <Clock className="w-5 h-5 text-green-600" />
              <span>Upcoming Appointment</span>
            </h3>

            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-sm text-gray-600">Date & Time</p>
                    <p className="text-gray-900 font-bold text-xl">
                      {format(parseISO(profile.next_appointment.date), 'EEEE, MMMM d, yyyy')}
                    </p>
                    <p className="text-gray-700 font-medium">{profile.next_appointment.time}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div>
                    <p className="text-sm text-gray-600">Procedure</p>
                    <p className="text-gray-900 font-medium">
                      {profile.next_appointment.procedure_type}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Provider</p>
                    <p className="text-gray-900 font-medium">
                      {profile.next_appointment.dentist_name}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-2">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-semibold ${
                    profile.next_appointment.status === 'confirmed'
                      ? 'bg-green-500 text-white'
                      : profile.next_appointment.status === 'scheduled'
                      ? 'bg-blue-500 text-white'
                      : 'bg-yellow-500 text-white'
                  }`}
                >
                  {profile.next_appointment.status.charAt(0).toUpperCase() +
                    profile.next_appointment.status.slice(1)}
                </span>
                <button className="flex items-center space-x-2 px-4 py-2 bg-white border border-green-500 text-green-600 rounded-lg hover:bg-green-50 transition-colors text-sm font-medium">
                  <FileText className="w-4 h-4" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Insurance Card Modal */}
      <AnimatePresence>
        {showInsuranceCard && profile.insurance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setShowInsuranceCard(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Insurance Card</h3>
                <button
                  onClick={() => setShowInsuranceCard(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {profile.insurance.insurance_card_front_url && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Front</p>
                    <img
                      src={profile.insurance.insurance_card_front_url}
                      alt="Insurance card front"
                      className="w-full rounded-lg border border-gray-200"
                    />
                  </div>
                )}
                {profile.insurance.insurance_card_back_url && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Back</p>
                    <img
                      src={profile.insurance.insurance_card_back_url}
                      alt="Insurance card back"
                      className="w-full rounded-lg border border-gray-200"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
