/**
 * Mock Dental Records Data
 * Complete dental profiles for all demo patients
 */

import type { PatientProfile } from '@/lib/types/dental-record';

export const mockDentalRecords: Record<string, PatientProfile> = {
  // Sarah Johnson - demo-p-001
  'demo-p-001': {
    patient_id: 'demo-p-001',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    first_name: 'Sarah',
    last_name: 'Johnson',
    date_of_birth: '1985-03-15',
    age: 40,
    gender: 'female',
    contact: {
      email: 'sarah.johnson@email.com',
      phone: '+16195551234',
      address: {
        street: '123 Oak Street',
        city: 'San Diego',
        state: 'CA',
        postal_code: '92101',
        country: 'USA',
      },
      emergency_contact: {
        name: 'Michael Johnson',
        relationship: 'Spouse',
        phone: '+16195551235',
      },
    },
    preferences: {
      preferred_dentist_id: 'doc-001',
      preferred_dentist_name: 'Dr. Emily Chen',
      preferred_hygienist_id: 'hyg-001',
      preferred_hygienist_name: 'Jane Williams',
      appointment_reminder_method: 'email',
      communication_language: 'English',
    },
    insurance: {
      provider_name: 'Delta Dental',
      coverage_type: 'private',
      coverage_percent: 70,
      policy_number: 'DD-928374-01',
      plan_id: 'PPO-PREMIUM',
      group_number: 'GRP-8392',
      subscriber_name: 'Sarah Johnson',
      subscriber_dob: '1985-03-15',
      effective_date: '2020-01-01',
      insurance_card_front_url: undefined,
      insurance_card_back_url: undefined,
    },
    financial: {
      total_lifetime_spent: 8450.0,
      average_visit_cost: 180.0,
      outstanding_balance: 0.0,
      last_payment_date: '2025-09-15',
      last_payment_amount: 250.0,
      payment_plan_active: false,
    },
    next_appointment: {
      appointment_id: 'apt-001',
      date: '2025-10-25',
      time: '14:00',
      procedure_type: 'Routine Cleaning',
      dentist_name: 'Dr. Emily Chen',
      status: 'confirmed',
    },
    radiographic_records: [
      {
        id: 'xr-001-01',
        type: 'periapical',
        file_url: '/xrays/dental-16.jpg',
        thumbnail_url: '/xrays/dental-16.jpg',
        date_taken: '2024-02-24',
        dentist_notes: 'Slight bone loss evident in posterior regions',
        ai_analysis: {
          summary: 'Automated screening identified conditions requiring review',
          detected_issues: []
        },
        metadata: {
          equipment: 'Dentsply Sirona ORTHOPHOS',
          file_size_mb: 4.46
        }
      },
      {
        id: 'xr-001-02',
        type: 'periapical',
        file_url: '/xrays/dental-12.jpg',
        thumbnail_url: '/xrays/dental-12.jpg',
        date_taken: '2024-09-15',
        dentist_notes: 'Healthy tooth structure, no abnormalities detected',
        ai_analysis: {
          summary: 'Automated screening identified conditions requiring review',
          detected_issues: []
        },
        metadata: {
          equipment: 'Dentsply Sirona ORTHOPHOS',
          file_size_mb: 3.0
        }
      },
      {
        id: 'xr-001-03',
        type: 'cbct',
        file_url: '/xrays/dental-3.jpg',
        thumbnail_url: '/xrays/dental-3.jpg',
        date_taken: '2024-09-24',
        dentist_notes: 'Minor calculus buildup visible',
        ai_analysis: {
          summary: 'AI analysis detected potential areas of concern',
          detected_issues: [
            {
              type: 'cavity',
              location: 'Tooth #14, distal surface',
              confidence_score: 92,
              severity: 'medium'
            }
          ]
        },
        metadata: {
          equipment: 'Planmeca ProMax 3D',
          file_size_mb: 3.91
        }
      }
    ],
  },

  // Michael Rodriguez - demo-p-002
  'demo-p-002': {
    patient_id: 'demo-p-002',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    first_name: 'Michael',
    last_name: 'Rodriguez',
    date_of_birth: '1978-07-22',
    age: 47,
    gender: 'male',
    contact: {
      email: 'michael.r@email.com',
      phone: '+16195552345',
      address: {
        street: '456 Pine Avenue',
        city: 'San Diego',
        state: 'CA',
        postal_code: '92102',
        country: 'USA',
      },
      emergency_contact: {
        name: 'Maria Rodriguez',
        relationship: 'Wife',
        phone: '+16195552346',
      },
    },
    preferences: {
      preferred_dentist_id: 'doc-002',
      preferred_dentist_name: 'Dr. James Wilson',
      preferred_hygienist_id: 'hyg-002',
      preferred_hygienist_name: 'Robert Thompson',
      appointment_reminder_method: 'sms',
      communication_language: 'English',
    },
    insurance: {
      provider_name: 'Cigna Dental',
      coverage_type: 'private',
      coverage_percent: 85,
      policy_number: 'CIG-445982',
      plan_id: 'DPPO',
      group_number: 'GRP-7821',
      subscriber_name: 'Michael Rodriguez',
      subscriber_dob: '1978-07-22',
      effective_date: '2020-01-01',
      insurance_card_front_url: undefined,
      insurance_card_back_url: undefined,
    },
    financial: {
      total_lifetime_spent: 12350.0,
      average_visit_cost: 210.0,
      outstanding_balance: 450.0,
      last_payment_date: '2025-10-10',
      last_payment_amount: 150.0,
      payment_plan_active: true,
    },
    next_appointment: {
      appointment_id: 'apt-002',
      date: '2025-11-05',
      time: '10:00',
      procedure_type: 'Crown Placement',
      dentist_name: 'Dr. James Wilson',
      status: 'confirmed',
    },
    radiographic_records: [
      {
        id: 'xr-002-01',
        type: 'periapical',
        file_url: '/xrays/dental-8.jpg',
        thumbnail_url: '/xrays/dental-8.jpg',
        date_taken: '2024-08-24',
        dentist_notes: 'Excellent bone density throughout',
        ai_analysis: {
          summary: 'Comprehensive AI analysis shows healthy structures',
          detected_issues: [
            {
              type: 'cavity',
              location: 'Tooth #14, distal surface',
              confidence_score: 92,
              severity: 'medium'
            },
            {
              type: 'calculus',
              location: 'Lower anterior teeth',
              confidence_score: 95,
              severity: 'medium'
            },
          ]
        },
        metadata: {
          equipment: 'Carestream CS 8100',
          file_size_mb: 4.42
        }
      },
      {
        id: 'xr-002-02',
        type: 'periapical',
        file_url: '/xrays/dental-16.jpg',
        thumbnail_url: '/xrays/dental-16.jpg',
        date_taken: '2024-09-06',
        dentist_notes: 'Some marginal bone resorption present',
        ai_analysis: {
          summary: 'Comprehensive AI analysis shows healthy structures',
          detected_issues: [
            {
              type: 'impacted_tooth',
              location: 'Tooth #32, horizontal impaction',
              confidence_score: 91,
              severity: 'medium'
            },
          ]
        },
        metadata: {
          equipment: 'Planmeca ProMax 3D',
          file_size_mb: 2.93
        }
      },
    ],
  },

  // Emily Chen - demo-p-003
  'demo-p-003': {
    patient_id: 'demo-p-003',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emily',
    first_name: 'Emily',
    last_name: 'Chen',
    date_of_birth: '1992-11-08',
    age: 32,
    gender: 'female',
    contact: {
      email: 'emily.chen@email.com',
      phone: '+16195553456',
      address: {
        street: '789 Maple Drive',
        city: 'San Diego',
        state: 'CA',
        postal_code: '92103',
        country: 'USA',
      },
      emergency_contact: {
        name: 'Kevin Chen',
        relationship: 'Brother',
        phone: '+16195553457',
      },
    },
    preferences: {
      preferred_dentist_id: 'doc-001',
      preferred_dentist_name: 'Dr. Emily Chen',
      preferred_hygienist_id: 'hyg-001',
      preferred_hygienist_name: 'Jane Williams',
      appointment_reminder_method: 'both',
      communication_language: 'English',
    },
    insurance: {
      provider_name: 'Aetna Dental',
      coverage_type: 'private',
      coverage_percent: 75,
      policy_number: 'AET-772341',
      plan_id: 'DMO-PLUS',
      group_number: 'GRP-9284',
      subscriber_name: 'Emily Chen',
      subscriber_dob: '1992-11-08',
      effective_date: '2020-01-01',
      insurance_card_front_url: undefined,
      insurance_card_back_url: undefined,
    },
    financial: {
      total_lifetime_spent: 3250.0,
      average_visit_cost: 120.0,
      outstanding_balance: 0.0,
      last_payment_date: '2025-10-12',
      last_payment_amount: 120.0,
      payment_plan_active: false,
    },
    next_appointment: {
      appointment_id: 'apt-003',
      date: '2025-10-28',
      time: '15:30',
      procedure_type: 'Routine Checkup',
      dentist_name: 'Dr. Emily Chen',
      status: 'confirmed',
    },
    radiographic_records: [
      {
        id: 'xr-003-01',
        type: 'bitewing',
        file_url: '/xrays/dental-15.jpg',
        thumbnail_url: '/xrays/dental-15.jpg',
        date_taken: '2024-10-14',
        dentist_notes: 'Slight bone loss evident in posterior regions',
        metadata: {
          equipment: 'Planmeca ProMax 3D',
          file_size_mb: 4.58
        }
      },
      {
        id: 'xr-003-02',
        type: 'periapical',
        file_url: '/xrays/dental-12.jpg',
        thumbnail_url: '/xrays/dental-12.jpg',
        date_taken: '2024-02-08',
        dentist_notes: 'Minor calculus buildup visible',
        ai_analysis: {
          summary: 'AI analysis detected potential areas of concern',
          detected_issues: [
          ]
        },
        metadata: {
          equipment: 'Dentsply Sirona ORTHOPHOS',
          file_size_mb: 4.12
        }
      },
    ],
  },

  // David Thompson - demo-p-004
  'demo-p-004': {
    patient_id: 'demo-p-004',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    first_name: 'David',
    last_name: 'Thompson',
    date_of_birth: '1965-05-30',
    age: 60,
    gender: 'male',
    contact: {
      email: 'david.t@email.com',
      phone: '+16195554567',
      address: {
        street: '321 Birch Lane',
        city: 'San Diego',
        state: 'CA',
        postal_code: '92104',
        country: 'USA',
      },
      emergency_contact: {
        name: 'Linda Thompson',
        relationship: 'Wife',
        phone: '+16195554568',
      },
    },
    preferences: {
      preferred_dentist_id: 'doc-003',
      preferred_dentist_name: 'Dr. Sarah Martinez',
      preferred_hygienist_id: 'hyg-003',
      preferred_hygienist_name: 'Anna Davis',
      appointment_reminder_method: 'both',
      communication_language: 'English',
    },
    insurance: {
      provider_name: 'MetLife Dental',
      coverage_type: 'private',
      coverage_percent: 80,
      policy_number: 'MET-334556',
      plan_id: 'PDP-SELECT',
      group_number: 'GRP-5672',
      subscriber_name: 'David Thompson',
      subscriber_dob: '1965-05-30',
      effective_date: '2020-01-01',
      insurance_card_front_url: undefined,
      insurance_card_back_url: undefined,
    },
    financial: {
      total_lifetime_spent: 18750.0,
      average_visit_cost: 320.0,
      outstanding_balance: 0.0,
      last_payment_date: '2025-08-20',
      last_payment_amount: 320.0,
      payment_plan_active: false,
    },
    next_appointment: {
      appointment_id: 'apt-004',
      date: '2025-10-30',
      time: '09:00',
      procedure_type: 'Periodontal Maintenance',
      dentist_name: 'Dr. Sarah Martinez',
      status: 'confirmed',
    },
    radiographic_records: [
      {
        id: 'xr-004-01',
        type: 'cbct',
        file_url: '/xrays/dental-7.jpg',
        thumbnail_url: '/xrays/dental-7.jpg',
        date_taken: '2024-06-20',
        dentist_notes: 'Minor calculus buildup visible',
        ai_analysis: {
          summary: 'AI analysis complete: No significant issues detected',
          detected_issues: [
          ]
        },
        metadata: {
          equipment: 'Kodak 8000C',
          file_size_mb: 3.7
        }
      },
      {
        id: 'xr-004-02',
        type: 'cbct',
        file_url: '/xrays/dental-13.jpg',
        thumbnail_url: '/xrays/dental-13.jpg',
        date_taken: '2024-10-07',
        dentist_notes: 'No significant pathology detected',
        metadata: {
          equipment: 'Planmeca ProMax 3D',
          file_size_mb: 2.55
        }
      },
    ],
  },

  // Jennifer Lee - demo-p-005
  'demo-p-005': {
    patient_id: 'demo-p-005',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jennifer',
    first_name: 'Jennifer',
    last_name: 'Lee',
    date_of_birth: '1988-09-12',
    age: 37,
    gender: 'female',
    contact: {
      email: 'jennifer.lee@email.com',
      phone: '+16195555678',
      address: {
        street: '654 Cedar Court',
        city: 'San Diego',
        state: 'CA',
        postal_code: '92105',
        country: 'USA',
      },
      emergency_contact: {
        name: 'Daniel Lee',
        relationship: 'Husband',
        phone: '+16195555679',
      },
    },
    preferences: {
      preferred_dentist_id: 'doc-002',
      preferred_dentist_name: 'Dr. James Wilson',
      preferred_hygienist_id: 'hyg-002',
      preferred_hygienist_name: 'Robert Thompson',
      appointment_reminder_method: 'email',
      communication_language: 'English',
    },
    insurance: {
      provider_name: 'Guardian Dental',
      coverage_type: 'private',
      coverage_percent: 70,
      policy_number: 'GRD-889234',
      plan_id: 'DentalGuard-Preferred',
      group_number: 'GRP-3421',
      subscriber_name: 'Jennifer Lee',
      subscriber_dob: '1988-09-12',
      effective_date: '2020-01-01',
      insurance_card_front_url: undefined,
      insurance_card_back_url: undefined,
    },
    financial: {
      total_lifetime_spent: 5890.0,
      average_visit_cost: 180.0,
      outstanding_balance: 0.0,
      last_payment_date: '2025-10-05',
      last_payment_amount: 180.0,
      payment_plan_active: false,
    },
    next_appointment: {
      appointment_id: 'apt-005',
      date: '2025-11-15',
      time: '13:00',
      procedure_type: 'Filling Replacement',
      dentist_name: 'Dr. James Wilson',
      status: 'confirmed',
    },
    radiographic_records: [
      {
        id: 'xr-005-01',
        type: 'periapical',
        file_url: '/xrays/dental-14.jpg',
        thumbnail_url: '/xrays/dental-14.jpg',
        date_taken: '2024-12-08',
        dentist_notes: 'Some marginal bone resorption present',
        ai_analysis: {
          summary: 'AI analysis detected potential areas of concern',
          detected_issues: [
            {
              type: 'impacted_tooth',
              location: 'Tooth #32, horizontal impaction',
              confidence_score: 91,
              severity: 'medium'
            },
            {
              type: 'periapical_lesion',
              location: 'Tooth #19 apex',
              confidence_score: 88,
              severity: 'high'
            },
            {
              type: 'bone_loss',
              location: 'Posterior mandible',
              confidence_score: 85,
              severity: 'high'
            },
          ]
        },
        metadata: {
          equipment: 'Kodak 8000C',
          file_size_mb: 2.49
        }
      },
      {
        id: 'xr-005-02',
        type: 'bitewing',
        file_url: '/xrays/dental-18.jpg',
        thumbnail_url: '/xrays/dental-18.jpg',
        date_taken: '2024-09-05',
        dentist_notes: 'Root canal filling appears adequate',
        ai_analysis: {
          summary: 'AI analysis complete: No significant issues detected',
          detected_issues: [
            {
              type: 'decay',
              location: 'Tooth #3, occlusal',
              confidence_score: 78,
              severity: 'low'
            },
            {
              type: 'periapical_lesion',
              location: 'Tooth #19 apex',
              confidence_score: 88,
              severity: 'high'
            },
            {
              type: 'impacted_tooth',
              location: 'Tooth #32, horizontal impaction',
              confidence_score: 91,
              severity: 'medium'
            },
          ]
        },
        metadata: {
          equipment: 'Dentsply Sirona ORTHOPHOS',
          file_size_mb: 3.91
        }
      },
      {
        id: 'xr-005-03',
        type: 'bitewing',
        file_url: '/xrays/dental-3.jpg',
        thumbnail_url: '/xrays/dental-3.jpg',
        date_taken: '2024-11-24',
        dentist_notes: 'Slight bone loss evident in posterior regions',
        metadata: {
          equipment: 'Planmeca ProMax 3D',
          file_size_mb: 3.94
        }
      },
    ],
  },

  // Robert Martinez - demo-p-006
  'demo-p-006': {
    patient_id: 'demo-p-006',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Robert',
    first_name: 'Robert',
    last_name: 'Martinez',
    date_of_birth: '1972-01-25',
    age: 53,
    gender: 'male',
    contact: {
      email: 'robert.m@email.com',
      phone: '+16195556789',
      address: {
        street: '987 Elm Street',
        city: 'San Diego',
        state: 'CA',
        postal_code: '92106',
        country: 'USA',
      },
      emergency_contact: {
        name: 'Sofia Martinez',
        relationship: 'Wife',
        phone: '+16195556790',
      },
    },
    preferences: {
      preferred_dentist_id: 'doc-001',
      preferred_dentist_name: 'Dr. Emily Chen',
      preferred_hygienist_id: 'hyg-001',
      preferred_hygienist_name: 'Jane Williams',
      appointment_reminder_method: 'sms',
      communication_language: 'English',
    },
    insurance: {
      provider_name: 'Delta Dental',
      coverage_type: 'private',
      coverage_percent: 85,
      policy_number: 'DD-556782',
      plan_id: 'PPO-STANDARD',
      group_number: 'GRP-4521',
      subscriber_name: 'Robert Martinez',
      subscriber_dob: '1972-01-25',
      effective_date: '2020-01-01',
      insurance_card_front_url: undefined,
      insurance_card_back_url: undefined,
    },
    financial: {
      total_lifetime_spent: 14200.0,
      average_visit_cost: 200.0,
      outstanding_balance: 850.0,
      last_payment_date: '2025-09-28',
      last_payment_amount: 200.0,
      payment_plan_active: true,
    },
    next_appointment: {
      appointment_id: 'apt-006',
      date: '2025-10-22',
      time: '11:00',
      procedure_type: 'Root Canal Follow-up',
      dentist_name: 'Dr. Emily Chen',
      status: 'confirmed',
    },
    radiographic_records: [
      {
        id: 'xr-006-01',
        type: 'cbct',
        file_url: '/xrays/dental-1.jpg',
        thumbnail_url: '/xrays/dental-1.jpg',
        date_taken: '2024-10-18',
        dentist_notes: 'Root canal filling appears adequate',
        metadata: {
          equipment: 'Kodak 8000C',
          file_size_mb: 2.23
        }
      },
      {
        id: 'xr-006-02',
        type: 'cbct',
        file_url: '/xrays/dental-8.jpg',
        thumbnail_url: '/xrays/dental-8.jpg',
        date_taken: '2024-05-27',
        dentist_notes: 'Crown margins appear well-adapted',
        ai_analysis: {
          summary: 'AI analysis detected potential areas of concern',
          detected_issues: [
            {
              type: 'bone_loss',
              location: 'Anterior maxilla',
              confidence_score: 79,
              severity: 'medium'
            },
          ]
        },
        metadata: {
          equipment: 'Carestream CS 8100',
          file_size_mb: 2.72
        }
      },
    ],
  },

  // Amanda Taylor - demo-p-007
  'demo-p-007': {
    patient_id: 'demo-p-007',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Amanda',
    first_name: 'Amanda',
    last_name: 'Taylor',
    date_of_birth: '1995-04-18',
    age: 30,
    gender: 'female',
    contact: {
      email: 'amanda.t@email.com',
      phone: '+16195557890',
      address: {
        street: '147 Willow Way',
        city: 'San Diego',
        state: 'CA',
        postal_code: '92107',
        country: 'USA',
      },
      emergency_contact: {
        name: 'Jessica Taylor',
        relationship: 'Sister',
        phone: '+16195557891',
      },
    },
    preferences: {
      preferred_dentist_id: 'doc-003',
      preferred_dentist_name: 'Dr. Sarah Martinez',
      preferred_hygienist_id: 'hyg-003',
      preferred_hygienist_name: 'Anna Davis',
      appointment_reminder_method: 'both',
      communication_language: 'English',
    },
    insurance: {
      provider_name: 'Cigna Dental',
      coverage_type: 'private',
      coverage_percent: 75,
      policy_number: 'CIG-998321',
      plan_id: 'DHMO',
      group_number: 'GRP-6731',
      subscriber_name: 'Amanda Taylor',
      subscriber_dob: '1995-04-18',
      effective_date: '2020-01-01',
      insurance_card_front_url: undefined,
      insurance_card_back_url: undefined,
    },
    financial: {
      total_lifetime_spent: 2150.0,
      average_visit_cost: 95.0,
      outstanding_balance: 0.0,
      last_payment_date: '2025-10-14',
      last_payment_amount: 95.0,
      payment_plan_active: false,
    },
    next_appointment: {
      appointment_id: 'apt-007',
      date: '2025-11-02',
      time: '14:30',
      procedure_type: 'Wisdom Teeth Consultation',
      dentist_name: 'Dr. Sarah Martinez',
      status: 'confirmed',
    },
    radiographic_records: [
      {
        id: 'xr-007-01',
        type: 'bitewing',
        file_url: '/xrays/dental-10.jpg',
        thumbnail_url: '/xrays/dental-10.jpg',
        date_taken: '2024-04-20',
        dentist_notes: 'Crown margins appear well-adapted',
        metadata: {
          equipment: 'Carestream CS 8100',
          file_size_mb: 2.22
        }
      },
      {
        id: 'xr-007-02',
        type: 'periapical',
        file_url: '/xrays/dental-19.jpg',
        thumbnail_url: '/xrays/dental-19.jpg',
        date_taken: '2024-01-20',
        dentist_notes: 'Some marginal bone resorption present',
        ai_analysis: {
          summary: 'AI analysis detected potential areas of concern',
          detected_issues: [
            {
              type: 'cavity',
              location: 'Tooth #18, mesial surface',
              confidence_score: 87,
              severity: 'high'
            },
            {
              type: 'bone_loss',
              location: 'Anterior maxilla',
              confidence_score: 79,
              severity: 'medium'
            },
          ]
        },
        metadata: {
          equipment: 'Planmeca ProMax 3D',
          file_size_mb: 1.96
        }
      },
      {
        id: 'xr-007-03',
        type: 'periapical',
        file_url: '/xrays/dental-12.jpg',
        thumbnail_url: '/xrays/dental-12.jpg',
        date_taken: '2024-08-14',
        dentist_notes: 'Clear bilateral bitewings showing no interproximal decay',
        metadata: {
          equipment: 'Kodak 8000C',
          file_size_mb: 3.16
        }
      },
    ],
  },

  // Christopher Anderson - demo-p-008
  'demo-p-008': {
    patient_id: 'demo-p-008',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Christopher',
    first_name: 'Christopher',
    last_name: 'Anderson',
    date_of_birth: '1980-12-03',
    age: 44,
    gender: 'male',
    contact: {
      email: 'chris.anderson@email.com',
      phone: '+16195558901',
      address: {
        street: '258 Spruce Street',
        city: 'San Diego',
        state: 'CA',
        postal_code: '92108',
        country: 'USA',
      },
      emergency_contact: {
        name: 'Rebecca Anderson',
        relationship: 'Wife',
        phone: '+16195558902',
      },
    },
    preferences: {
      preferred_dentist_id: 'doc-002',
      preferred_dentist_name: 'Dr. James Wilson',
      preferred_hygienist_id: 'hyg-002',
      preferred_hygienist_name: 'Robert Thompson',
      appointment_reminder_method: 'both',
      communication_language: 'English',
    },
    insurance: {
      provider_name: 'Aetna Dental',
      coverage_type: 'private',
      coverage_percent: 80,
      policy_number: 'AET-445623',
      plan_id: 'PPO-Elite',
      group_number: 'GRP-8932',
      subscriber_name: 'Christopher Anderson',
      subscriber_dob: '1980-12-03',
      effective_date: '2020-01-01',
      insurance_card_front_url: undefined,
      insurance_card_back_url: undefined,
    },
    financial: {
      total_lifetime_spent: 9870.0,
      average_visit_cost: 275.0,
      outstanding_balance: 0.0,
      last_payment_date: '2025-09-22',
      last_payment_amount: 275.0,
      payment_plan_active: false,
    },
    next_appointment: {
      appointment_id: 'apt-008',
      date: '2025-10-27',
      time: '10:30',
      procedure_type: 'Routine Cleaning',
      dentist_name: 'Dr. James Wilson',
      status: 'confirmed',
    },
    radiographic_records: [
      {
        id: 'xr-008-01',
        type: 'cbct',
        file_url: '/xrays/dental-1.jpg',
        thumbnail_url: '/xrays/dental-1.jpg',
        date_taken: '2024-07-23',
        dentist_notes: 'Excellent bone density throughout',
        ai_analysis: {
          summary: 'AI analysis complete: No significant issues detected',
          detected_issues: [
            {
              type: 'periapical_lesion',
              location: 'Tooth #19 apex',
              confidence_score: 88,
              severity: 'high'
            },
            {
              type: 'impacted_tooth',
              location: 'Tooth #32, horizontal impaction',
              confidence_score: 91,
              severity: 'medium'
            },
          ]
        },
        metadata: {
          equipment: 'Carestream CS 8100',
          file_size_mb: 2.13
        }
      },
      {
        id: 'xr-008-02',
        type: 'periapical',
        file_url: '/xrays/dental-3.jpg',
        thumbnail_url: '/xrays/dental-3.jpg',
        date_taken: '2024-11-03',
        dentist_notes: 'Some marginal bone resorption present',
        metadata: {
          equipment: 'Kodak 8000C',
          file_size_mb: 2.36
        }
      },
      {
        id: 'xr-008-03',
        type: 'bitewing',
        file_url: '/xrays/dental-13.jpg',
        thumbnail_url: '/xrays/dental-13.jpg',
        date_taken: '2024-01-08',
        dentist_notes: 'Slight bone loss evident in posterior regions',
        metadata: {
          equipment: 'Dentsply Sirona ORTHOPHOS',
          file_size_mb: 4.28
        }
      },
      {
        id: 'xr-008-04',
        type: 'panoramic',
        file_url: '/xrays/dental-8.jpg',
        thumbnail_url: '/xrays/dental-8.jpg',
        date_taken: '2024-12-01',
        dentist_notes: 'Well-defined periapical radiolucency noted',
        ai_analysis: {
          summary: 'AI screening complete: Recommend follow-up examination',
          detected_issues: [
          ]
        },
        metadata: {
          equipment: 'Dentsply Sirona ORTHOPHOS',
          file_size_mb: 3.93
        }
      },
    ],
  },

  // Lisa White - demo-p-009
  'demo-p-009': {
    patient_id: 'demo-p-009',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    first_name: 'Lisa',
    last_name: 'White',
    date_of_birth: '1990-06-14',
    age: 35,
    gender: 'female',
    contact: {
      email: 'lisa.white@email.com',
      phone: '+16195559012',
      address: {
        street: '369 Ash Avenue',
        city: 'San Diego',
        state: 'CA',
        postal_code: '92109',
        country: 'USA',
      },
      emergency_contact: {
        name: 'Mark White',
        relationship: 'Husband',
        phone: '+16195559013',
      },
    },
    preferences: {
      preferred_dentist_id: 'doc-001',
      preferred_dentist_name: 'Dr. Emily Chen',
      preferred_hygienist_id: 'hyg-001',
      preferred_hygienist_name: 'Jane Williams',
      appointment_reminder_method: 'email',
      communication_language: 'English',
    },
    insurance: {
      provider_name: 'MetLife Dental',
      coverage_type: 'private',
      coverage_percent: 70,
      policy_number: 'MET-778934',
      plan_id: 'TakeAlong-Dental',
      group_number: 'GRP-2341',
      subscriber_name: 'Lisa White',
      subscriber_dob: '1990-06-14',
      effective_date: '2020-01-01',
      insurance_card_front_url: undefined,
      insurance_card_back_url: undefined,
    },
    financial: {
      total_lifetime_spent: 4560.0,
      average_visit_cost: 140.0,
      outstanding_balance: 0.0,
      last_payment_date: '2025-10-08',
      last_payment_amount: 140.0,
      payment_plan_active: false,
    },
    next_appointment: {
      appointment_id: 'apt-009',
      date: '2025-11-10',
      time: '15:00',
      procedure_type: 'Veneer Consultation',
      dentist_name: 'Dr. Emily Chen',
      status: 'confirmed',
    },
    radiographic_records: [
      {
        id: 'xr-009-01',
        type: 'bitewing',
        file_url: '/xrays/dental-5.jpg',
        thumbnail_url: '/xrays/dental-5.jpg',
        date_taken: '2024-10-21',
        dentist_notes: 'Healthy tooth structure, no abnormalities detected',
        ai_analysis: {
          summary: 'AI analysis complete: No significant issues detected',
          detected_issues: [
            {
              type: 'impacted_tooth',
              location: 'Tooth #32, horizontal impaction',
              confidence_score: 91,
              severity: 'medium'
            },
            {
              type: 'cavity',
              location: 'Tooth #18, mesial surface',
              confidence_score: 87,
              severity: 'high'
            },
            {
              type: 'bone_loss',
              location: 'Posterior mandible',
              confidence_score: 85,
              severity: 'high'
            },
          ]
        },
        metadata: {
          equipment: 'Dentsply Sirona ORTHOPHOS',
          file_size_mb: 3.37
        }
      },
      {
        id: 'xr-009-02',
        type: 'cbct',
        file_url: '/xrays/dental-6.jpg',
        thumbnail_url: '/xrays/dental-6.jpg',
        date_taken: '2024-05-09',
        dentist_notes: 'Some marginal bone resorption present',
        ai_analysis: {
          summary: 'Automated screening identified conditions requiring review',
          detected_issues: [
          ]
        },
        metadata: {
          equipment: 'Planmeca ProMax 3D',
          file_size_mb: 1.28
        }
      },
      {
        id: 'xr-009-03',
        type: 'periapical',
        file_url: '/xrays/dental-14.jpg',
        thumbnail_url: '/xrays/dental-14.jpg',
        date_taken: '2024-04-14',
        dentist_notes: 'Root canal filling appears adequate',
        ai_analysis: {
          summary: 'AI analysis complete: No significant issues detected',
          detected_issues: [
          ]
        },
        metadata: {
          equipment: 'Dentsply Sirona ORTHOPHOS',
          file_size_mb: 3.14
        }
      },
    ],
  },

  // James Brown - demo-p-010
  'demo-p-010': {
    patient_id: 'demo-p-010',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    first_name: 'James',
    last_name: 'Brown',
    date_of_birth: '1968-08-27',
    age: 57,
    gender: 'male',
    contact: {
      email: 'james.brown@email.com',
      phone: '+16195550123',
      address: {
        street: '741 Poplar Place',
        city: 'San Diego',
        state: 'CA',
        postal_code: '92110',
        country: 'USA',
      },
      emergency_contact: {
        name: 'Betty Brown',
        relationship: 'Wife',
        phone: '+16195550124',
      },
    },
    preferences: {
      preferred_dentist_id: 'doc-003',
      preferred_dentist_name: 'Dr. Sarah Martinez',
      preferred_hygienist_id: 'hyg-003',
      preferred_hygienist_name: 'Anna Davis',
      appointment_reminder_method: 'sms',
      communication_language: 'English',
    },
    insurance: {
      provider_name: 'Guardian Dental',
      coverage_type: 'private',
      coverage_percent: 85,
      policy_number: 'GRD-223445',
      plan_id: 'DentalGuard-Basic',
      group_number: 'GRP-5672',
      subscriber_name: 'James Brown',
      subscriber_dob: '1968-08-27',
      effective_date: '2020-01-01',
      insurance_card_front_url: undefined,
      insurance_card_back_url: undefined,
    },
    financial: {
      total_lifetime_spent: 21450.0,
      average_visit_cost: 390.0,
      outstanding_balance: 0.0,
      last_payment_date: '2025-09-30',
      last_payment_amount: 390.0,
      payment_plan_active: false,
    },
    next_appointment: {
      appointment_id: 'apt-010',
      date: '2025-10-24',
      time: '09:30',
      procedure_type: 'Bridge Fitting',
      dentist_name: 'Dr. Sarah Martinez',
      status: 'confirmed',
    },
    radiographic_records: [
      {
        id: 'xr-010-01',
        type: 'panoramic',
        file_url: '/xrays/dental-6.jpg',
        thumbnail_url: '/xrays/dental-6.jpg',
        date_taken: '2024-01-04',
        dentist_notes: 'Healthy tooth structure, no abnormalities detected',
        ai_analysis: {
          summary: 'AI screening complete: Recommend follow-up examination',
          detected_issues: [
          ]
        },
        metadata: {
          equipment: 'Planmeca ProMax 3D',
          file_size_mb: 2.27
        }
      },
      {
        id: 'xr-010-02',
        type: 'bitewing',
        file_url: '/xrays/dental-7.jpg',
        thumbnail_url: '/xrays/dental-7.jpg',
        date_taken: '2024-02-05',
        dentist_notes: 'No significant pathology detected',
        metadata: {
          equipment: 'Dentsply Sirona ORTHOPHOS',
          file_size_mb: 2.13
        }
      },
    ],
  },

  // Patricia Garcia - demo-p-011
  'demo-p-011': {
    patient_id: 'demo-p-011',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Patricia',
    first_name: 'Patricia',
    last_name: 'Garcia',
    date_of_birth: '1987-02-19',
    age: 38,
    gender: 'female',
    contact: {
      email: 'patricia.g@email.com',
      phone: '+16195551234',
      address: {
        street: '852 Hickory Hill',
        city: 'San Diego',
        state: 'CA',
        postal_code: '92111',
        country: 'USA',
      },
      emergency_contact: {
        name: 'Carlos Garcia',
        relationship: 'Husband',
        phone: '+16195551235',
      },
    },
    preferences: {
      preferred_dentist_id: 'doc-002',
      preferred_dentist_name: 'Dr. James Wilson',
      preferred_hygienist_id: 'hyg-002',
      preferred_hygienist_name: 'Robert Thompson',
      appointment_reminder_method: 'both',
      communication_language: 'English',
    },
    insurance: {
      provider_name: 'Delta Dental',
      coverage_type: 'private',
      coverage_percent: 75,
      policy_number: 'DD-667823',
      plan_id: 'PPO-PLUS',
      group_number: 'GRP-7821',
      subscriber_name: 'Patricia Garcia',
      subscriber_dob: '1987-02-19',
      effective_date: '2020-01-01',
      insurance_card_front_url: undefined,
      insurance_card_back_url: undefined,
    },
    financial: {
      total_lifetime_spent: 6720.0,
      average_visit_cost: 100.0,
      outstanding_balance: 325.0,
      last_payment_date: '2025-10-11',
      last_payment_amount: 100.0,
      payment_plan_active: true,
    },
    next_appointment: {
      appointment_id: 'apt-011',
      date: '2025-11-08',
      time: '11:30',
      procedure_type: 'Cavity Filling',
      dentist_name: 'Dr. James Wilson',
      status: 'confirmed',
    },
    radiographic_records: [
      {
        id: 'xr-011-01',
        type: 'bitewing',
        file_url: '/xrays/dental-9.jpg',
        thumbnail_url: '/xrays/dental-9.jpg',
        date_taken: '2024-09-24',
        dentist_notes: 'Minor calculus buildup visible',
        metadata: {
          equipment: 'Dentsply Sirona ORTHOPHOS',
          file_size_mb: 4.29
        }
      },
      {
        id: 'xr-011-02',
        type: 'panoramic',
        file_url: '/xrays/dental-13.jpg',
        thumbnail_url: '/xrays/dental-13.jpg',
        date_taken: '2024-07-02',
        dentist_notes: 'Slight bone loss evident in posterior regions',
        metadata: {
          equipment: 'Dentsply Sirona ORTHOPHOS',
          file_size_mb: 4.34
        }
      },
      {
        id: 'xr-011-03',
        type: 'panoramic',
        file_url: '/xrays/dental-20.jpg',
        thumbnail_url: '/xrays/dental-20.jpg',
        date_taken: '2024-09-04',
        dentist_notes: 'Excellent bone density throughout',
        ai_analysis: {
          summary: 'Automated screening identified conditions requiring review',
          detected_issues: [
          ]
        },
        metadata: {
          equipment: 'Planmeca ProMax 3D',
          file_size_mb: 4.29
        }
      },
    ],
  },

  // Daniel Miller - demo-p-012
  'demo-p-012': {
    patient_id: 'demo-p-012',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Daniel',
    first_name: 'Daniel',
    last_name: 'Miller',
    date_of_birth: '1975-10-05',
    age: 50,
    gender: 'male',
    contact: {
      email: 'daniel.miller@email.com',
      phone: '+16195552345',
      address: {
        street: '963 Redwood Road',
        city: 'San Diego',
        state: 'CA',
        postal_code: '92112',
        country: 'USA',
      },
      emergency_contact: {
        name: 'Susan Miller',
        relationship: 'Wife',
        phone: '+16195552346',
      },
    },
    preferences: {
      preferred_dentist_id: 'doc-001',
      preferred_dentist_name: 'Dr. Emily Chen',
      preferred_hygienist_id: 'hyg-001',
      preferred_hygienist_name: 'Jane Williams',
      appointment_reminder_method: 'both',
      communication_language: 'English',
    },
    insurance: {
      provider_name: 'Cigna Dental',
      coverage_type: 'private',
      coverage_percent: 80,
      policy_number: 'CIG-334521',
      plan_id: 'DPPO-Premium',
      group_number: 'GRP-4521',
      subscriber_name: 'Daniel Miller',
      subscriber_dob: '1975-10-05',
      effective_date: '2020-01-01',
      insurance_card_front_url: undefined,
      insurance_card_back_url: undefined,
    },
    financial: {
      total_lifetime_spent: 11230.0,
      average_visit_cost: 210.0,
      outstanding_balance: 0.0,
      last_payment_date: '2025-09-25',
      last_payment_amount: 210.0,
      payment_plan_active: false,
    },
    next_appointment: {
      appointment_id: 'apt-012',
      date: '2025-10-29',
      time: '14:00',
      procedure_type: 'Implant Consultation',
      dentist_name: 'Dr. Emily Chen',
      status: 'confirmed',
    },
    radiographic_records: [
      {
        id: 'xr-012-01',
        type: 'panoramic',
        file_url: '/xrays/dental-5.jpg',
        thumbnail_url: '/xrays/dental-5.jpg',
        date_taken: '2024-07-28',
        dentist_notes: 'Root canal filling appears adequate',
        ai_analysis: {
          summary: 'AI analysis detected potential areas of concern',
          detected_issues: [
            {
              type: 'impacted_tooth',
              location: 'Tooth #32, horizontal impaction',
              confidence_score: 91,
              severity: 'medium'
            },
            {
              type: 'calculus',
              location: 'Lower anterior teeth',
              confidence_score: 95,
              severity: 'medium'
            },
          ]
        },
        metadata: {
          equipment: 'Planmeca ProMax 3D',
          file_size_mb: 2.61
        }
      },
      {
        id: 'xr-012-02',
        type: 'periapical',
        file_url: '/xrays/dental-11.jpg',
        thumbnail_url: '/xrays/dental-11.jpg',
        date_taken: '2024-06-09',
        dentist_notes: 'Clear bilateral bitewings showing no interproximal decay',
        ai_analysis: {
          summary: 'Comprehensive AI analysis shows healthy structures',
          detected_issues: [
            {
              type: 'cavity',
              location: 'Tooth #14, distal surface',
              confidence_score: 92,
              severity: 'medium'
            },
            {
              type: 'decay',
              location: 'Tooth #3, occlusal',
              confidence_score: 78,
              severity: 'low'
            },
          ]
        },
        metadata: {
          equipment: 'Kodak 8000C',
          file_size_mb: 2.99
        }
      },
      {
        id: 'xr-012-03',
        type: 'cbct',
        file_url: '/xrays/dental-10.jpg',
        thumbnail_url: '/xrays/dental-10.jpg',
        date_taken: '2024-10-15',
        dentist_notes: 'Healthy tooth structure, no abnormalities detected',
        ai_analysis: {
          summary: 'Automated screening identified conditions requiring review',
          detected_issues: [
            {
              type: 'periapical_lesion',
              location: 'Tooth #19 apex',
              confidence_score: 88,
              severity: 'high'
            },
          ]
        },
        metadata: {
          equipment: 'Carestream CS 8100',
          file_size_mb: 3.05
        }
      },
      {
        id: 'xr-012-04',
        type: 'periapical',
        file_url: '/xrays/dental-13.jpg',
        thumbnail_url: '/xrays/dental-13.jpg',
        date_taken: '2024-03-04',
        dentist_notes: 'Clear bilateral bitewings showing no interproximal decay',
        ai_analysis: {
          summary: 'AI analysis detected potential areas of concern',
          detected_issues: [
            {
              type: 'cavity',
              location: 'Tooth #18, mesial surface',
              confidence_score: 87,
              severity: 'high'
            },
            {
              type: 'cavity',
              location: 'Tooth #14, distal surface',
              confidence_score: 92,
              severity: 'medium'
            },
            {
              type: 'calculus',
              location: 'Lower anterior teeth',
              confidence_score: 95,
              severity: 'medium'
            },
          ]
        },
        metadata: {
          equipment: 'Kodak 8000C',
          file_size_mb: 2.31
        }
      },
    ],
  },

  // Nancy Wilson - demo-p-013
  'demo-p-013': {
    patient_id: 'demo-p-013',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nancy',
    first_name: 'Nancy',
    last_name: 'Wilson',
    date_of_birth: '1993-07-11',
    age: 32,
    gender: 'female',
    contact: {
      email: 'nancy.wilson@email.com',
      phone: '+16195553456',
      address: {
        street: '159 Magnolia Street',
        city: 'San Diego',
        state: 'CA',
        postal_code: '92113',
        country: 'USA',
      },
      emergency_contact: {
        name: 'Robert Wilson',
        relationship: 'Father',
        phone: '+16195553457',
      },
    },
    preferences: {
      preferred_dentist_id: 'doc-003',
      preferred_dentist_name: 'Dr. Sarah Martinez',
      preferred_hygienist_id: 'hyg-003',
      preferred_hygienist_name: 'Anna Davis',
      appointment_reminder_method: 'email',
      communication_language: 'English',
    },
    insurance: {
      provider_name: 'Aetna Dental',
      coverage_type: 'private',
      coverage_percent: 70,
      policy_number: 'AET-889123',
      plan_id: 'DMO-Standard',
      group_number: 'GRP-6731',
      subscriber_name: 'Nancy Wilson',
      subscriber_dob: '1993-07-11',
      effective_date: '2020-01-01',
      insurance_card_front_url: undefined,
      insurance_card_back_url: undefined,
    },
    financial: {
      total_lifetime_spent: 3890.0,
      average_visit_cost: 110.0,
      outstanding_balance: 0.0,
      last_payment_date: '2025-10-13',
      last_payment_amount: 110.0,
      payment_plan_active: false,
    },
    next_appointment: {
      appointment_id: 'apt-013',
      date: '2025-11-12',
      time: '10:00',
      procedure_type: 'Teeth Whitening',
      dentist_name: 'Dr. Sarah Martinez',
      status: 'confirmed',
    },
    radiographic_records: [
      {
        id: 'xr-013-01',
        type: 'cbct',
        file_url: '/xrays/dental-4.jpg',
        thumbnail_url: '/xrays/dental-4.jpg',
        date_taken: '2024-09-25',
        dentist_notes: 'Clear bilateral bitewings showing no interproximal decay',
        ai_analysis: {
          summary: 'Automated screening identified conditions requiring review',
          detected_issues: [
            {
              type: 'impacted_tooth',
              location: 'Tooth #32, horizontal impaction',
              confidence_score: 91,
              severity: 'medium'
            },
          ]
        },
        metadata: {
          equipment: 'Kodak 8000C',
          file_size_mb: 4.66
        }
      },
      {
        id: 'xr-013-02',
        type: 'periapical',
        file_url: '/xrays/dental-9.jpg',
        thumbnail_url: '/xrays/dental-9.jpg',
        date_taken: '2024-11-23',
        dentist_notes: 'Root canal filling appears adequate',
        ai_analysis: {
          summary: 'Comprehensive AI analysis shows healthy structures',
          detected_issues: [
          ]
        },
        metadata: {
          equipment: 'Carestream CS 8100',
          file_size_mb: 4.34
        }
      },
      {
        id: 'xr-013-03',
        type: 'periapical',
        file_url: '/xrays/dental-8.jpg',
        thumbnail_url: '/xrays/dental-8.jpg',
        date_taken: '2024-08-06',
        dentist_notes: 'Slight bone loss evident in posterior regions',
        ai_analysis: {
          summary: 'Comprehensive AI analysis shows healthy structures',
          detected_issues: [
            {
              type: 'calculus',
              location: 'Lower anterior teeth',
              confidence_score: 95,
              severity: 'medium'
            },
            {
              type: 'decay',
              location: 'Tooth #3, occlusal',
              confidence_score: 78,
              severity: 'low'
            },
          ]
        },
        metadata: {
          equipment: 'Planmeca ProMax 3D',
          file_size_mb: 4.63
        }
      },
    ],
  },

  // Kevin Moore - demo-p-014
  'demo-p-014': {
    patient_id: 'demo-p-014',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kevin',
    first_name: 'Kevin',
    last_name: 'Moore',
    date_of_birth: '1982-03-28',
    age: 43,
    gender: 'male',
    contact: {
      email: 'kevin.moore@email.com',
      phone: '+16195554567',
      address: {
        street: '357 Dogwood Drive',
        city: 'San Diego',
        state: 'CA',
        postal_code: '92114',
        country: 'USA',
      },
      emergency_contact: {
        name: 'Rachel Moore',
        relationship: 'Wife',
        phone: '+16195554568',
      },
    },
    preferences: {
      preferred_dentist_id: 'doc-002',
      preferred_dentist_name: 'Dr. James Wilson',
      preferred_hygienist_id: 'hyg-002',
      preferred_hygienist_name: 'Robert Thompson',
      appointment_reminder_method: 'sms',
      communication_language: 'English',
    },
    insurance: {
      provider_name: 'MetLife Dental',
      coverage_type: 'private',
      coverage_percent: 85,
      policy_number: 'MET-556734',
      plan_id: 'PDP-Value',
      group_number: 'GRP-8932',
      subscriber_name: 'Kevin Moore',
      subscriber_dob: '1982-03-28',
      effective_date: '2020-01-01',
      insurance_card_front_url: undefined,
      insurance_card_back_url: undefined,
    },
    financial: {
      total_lifetime_spent: 7840.0,
      average_visit_cost: 165.0,
      outstanding_balance: 0.0,
      last_payment_date: '2025-10-07',
      last_payment_amount: 165.0,
      payment_plan_active: false,
    },
    next_appointment: {
      appointment_id: 'apt-014',
      date: '2025-11-01',
      time: '13:30',
      procedure_type: 'Emergency Exam',
      dentist_name: 'Dr. James Wilson',
      status: 'confirmed',
    },
    radiographic_records: [
      {
        id: 'xr-014-01',
        type: 'periapical',
        file_url: '/xrays/dental-18.jpg',
        thumbnail_url: '/xrays/dental-18.jpg',
        date_taken: '2024-11-22',
        dentist_notes: 'Well-defined periapical radiolucency noted',
        metadata: {
          equipment: 'Planmeca ProMax 3D',
          file_size_mb: 3.3
        }
      },
      {
        id: 'xr-014-02',
        type: 'cbct',
        file_url: '/xrays/dental-3.jpg',
        thumbnail_url: '/xrays/dental-3.jpg',
        date_taken: '2024-03-17',
        dentist_notes: 'No significant pathology detected',
        metadata: {
          equipment: 'Carestream CS 8100',
          file_size_mb: 1.97
        }
      },
      {
        id: 'xr-014-03',
        type: 'cbct',
        file_url: '/xrays/dental-10.jpg',
        thumbnail_url: '/xrays/dental-10.jpg',
        date_taken: '2024-02-10',
        dentist_notes: 'Well-defined periapical radiolucency noted',
        ai_analysis: {
          summary: 'AI analysis complete: No significant issues detected',
          detected_issues: [
            {
              type: 'cavity',
              location: 'Tooth #18, mesial surface',
              confidence_score: 87,
              severity: 'high'
            },
            {
              type: 'cavity',
              location: 'Tooth #14, distal surface',
              confidence_score: 92,
              severity: 'medium'
            },
            {
              type: 'periapical_lesion',
              location: 'Tooth #19 apex',
              confidence_score: 88,
              severity: 'high'
            },
          ]
        },
        metadata: {
          equipment: 'Carestream CS 8100',
          file_size_mb: 4.43
        }
      },
      {
        id: 'xr-014-04',
        type: 'bitewing',
        file_url: '/xrays/dental-9.jpg',
        thumbnail_url: '/xrays/dental-9.jpg',
        date_taken: '2024-08-06',
        dentist_notes: 'No significant pathology detected',
        ai_analysis: {
          summary: 'AI screening complete: Recommend follow-up examination',
          detected_issues: [
            {
              type: 'cavity',
              location: 'Tooth #18, mesial surface',
              confidence_score: 87,
              severity: 'high'
            },
          ]
        },
        metadata: {
          equipment: 'Dentsply Sirona ORTHOPHOS',
          file_size_mb: 2.48
        }
      },
    ],
  },

  // Karen Davis - demo-p-015
  'demo-p-015': {
    patient_id: 'demo-p-015',
    profile_photo_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karen',
    first_name: 'Karen',
    last_name: 'Davis',
    date_of_birth: '1970-11-16',
    age: 55,
    gender: 'female',
    contact: {
      email: 'karen.davis@email.com',
      phone: '+16195555678',
      address: {
        street: '486 Sycamore Lane',
        city: 'San Diego',
        state: 'CA',
        postal_code: '92115',
        country: 'USA',
      },
      emergency_contact: {
        name: 'Steven Davis',
        relationship: 'Husband',
        phone: '+16195555679',
      },
    },
    preferences: {
      preferred_dentist_id: 'doc-001',
      preferred_dentist_name: 'Dr. Emily Chen',
      preferred_hygienist_id: 'hyg-001',
      preferred_hygienist_name: 'Jane Williams',
      appointment_reminder_method: 'both',
      communication_language: 'English',
    },
    insurance: {
      provider_name: 'Guardian Dental',
      coverage_type: 'private',
      coverage_percent: 75,
      policy_number: 'GRD-445678',
      plan_id: 'DentalGuard-Premier',
      group_number: 'GRP-2341',
      subscriber_name: 'Karen Davis',
      subscriber_dob: '1970-11-16',
      effective_date: '2020-01-01',
      insurance_card_front_url: undefined,
      insurance_card_back_url: undefined,
    },
    financial: {
      total_lifetime_spent: 16780.0,
      average_visit_cost: 295.0,
      outstanding_balance: 0.0,
      last_payment_date: '2025-09-18',
      last_payment_amount: 295.0,
      payment_plan_active: false,
    },
    next_appointment: {
      appointment_id: 'apt-015',
      date: '2025-10-26',
      time: '15:30',
      procedure_type: 'Denture Adjustment',
      dentist_name: 'Dr. Emily Chen',
      status: 'confirmed',
    },
    radiographic_records: [
      {
        id: 'xr-015-01',
        type: 'bitewing',
        file_url: '/xrays/dental-1.jpg',
        thumbnail_url: '/xrays/dental-1.jpg',
        date_taken: '2024-04-26',
        dentist_notes: 'Excellent bone density throughout',
        metadata: {
          equipment: 'Dentsply Sirona ORTHOPHOS',
          file_size_mb: 4.42
        }
      },
      {
        id: 'xr-015-02',
        type: 'bitewing',
        file_url: '/xrays/dental-12.jpg',
        thumbnail_url: '/xrays/dental-12.jpg',
        date_taken: '2024-03-15',
        dentist_notes: 'Slight bone loss evident in posterior regions',
        ai_analysis: {
          summary: 'AI screening complete: Recommend follow-up examination',
          detected_issues: [
            {
              type: 'decay',
              location: 'Tooth #3, occlusal',
              confidence_score: 78,
              severity: 'low'
            },
            {
              type: 'bone_loss',
              location: 'Anterior maxilla',
              confidence_score: 79,
              severity: 'medium'
            },
          ]
        },
        metadata: {
          equipment: 'Planmeca ProMax 3D',
          file_size_mb: 3.08
        }
      },
      {
        id: 'xr-015-03',
        type: 'panoramic',
        file_url: '/xrays/dental-2.jpg',
        thumbnail_url: '/xrays/dental-2.jpg',
        date_taken: '2024-06-20',
        dentist_notes: 'Crown margins appear well-adapted',
        metadata: {
          equipment: 'Carestream CS 8100',
          file_size_mb: 3.9
        }
      },
    ],
  },

};

/**
 * Get dental record by patient ID
 */
export function getDentalRecordById(patientId: string): PatientProfile | undefined {
  return mockDentalRecords[patientId];
}

/**
 * Get all dental records
 */
export function getAllDentalRecords(): PatientProfile[] {
  return Object.values(mockDentalRecords);
}

/**
 * Check if dental record exists for patient
 */
export function hasDentalRecord(patientId: string): boolean {
  return patientId in mockDentalRecords;
}

