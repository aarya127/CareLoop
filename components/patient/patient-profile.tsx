'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getInitials, formatCurrency, maskSensitiveData } from '@/lib/utils';
import { hasPermission, UserRole } from '@/lib/auth';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  AlertCircle,
  DollarSign,
  Activity,
} from 'lucide-react';

interface PatientProfileProps {
  patientId: string;
  currentUserRole: UserRole;
}

// Mock patient data
const mockPatient = {
  id: '1',
  firstName: 'Sarah',
  lastName: 'Johnson',
  dateOfBirth: '1985-03-15',
  phone: '(555) 123-4567',
  email: 'sarah.johnson@email.com',
  address: {
    street: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102',
  },
  tags: ['Allergies: Penicillin', 'High Risk'],
  avatar: null,
  insurance: {
    payer: 'Delta Dental',
    plan: 'PPO Plus',
    memberId: 'DD123456789',
    eligibilityStatus: 'active' as const,
    deductible: 1500,
    deductibleMet: 750,
    remainingBenefits: 2000,
    lastVerified: '2025-10-15',
  },
  clinical: {
    lastProcedures: [
      { date: '2023-08-15', procedure: 'Crown - #14', provider: 'Dr. Smith' },
      { date: '2025-06-10', procedure: 'Cleaning', provider: 'Dr. Lee' },
    ],
    upcomingPlan: [
      { procedure: 'Root Canal - #19', estimatedCost: 1200 },
    ],
  },
  financial: {
    balance: 120,
    lastPayment: { date: '2025-09-01', amount: 80 },
  },
  recentActivity: [
    { date: '2025-10-16', type: 'call', description: 'Requested appointment for tooth pain' },
    { date: '2025-10-10', type: 'message', description: 'Sent appointment reminder' },
  ],
};

export function PatientProfile({ patientId, currentUserRole }: PatientProfileProps) {
  const canViewClinical = hasPermission(currentUserRole, 'patient:clinical');
  const canViewFinancial = hasPermission(currentUserRole, 'patient:financial');
  const canViewDemographics = hasPermission(currentUserRole, 'patient:demographics');

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-semibold text-primary">
                {getInitials(`${mockPatient.firstName} ${mockPatient.lastName}`)}
              </span>
            </div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">
                    {mockPatient.firstName} {mockPatient.lastName}
                  </h2>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      DOB: {new Date(mockPatient.dateOfBirth).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {mockPatient.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {mockPatient.email}
                    </span>
                  </div>
                  
                  <div className="flex gap-2">
                    {mockPatient.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant={tag.includes('High Risk') ? 'destructive' : 'secondary'}
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                  <Button variant="outline" size="sm">
                    <Mail className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Insurance Coverage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Insurance Coverage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Provider</span>
                <span className="font-semibold">{mockPatient.insurance.payer}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Plan</span>
                <span>{mockPatient.insurance.plan}</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Member ID</span>
                <span className="font-mono text-sm">
                  {maskSensitiveData(mockPatient.insurance.memberId)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <Badge variant={mockPatient.insurance.eligibilityStatus === 'active' ? 'default' : 'secondary'}>
                  {mockPatient.insurance.eligibilityStatus}
                </Badge>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deductible</span>
                  <span>{formatCurrency(mockPatient.insurance.deductible)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deductible Met</span>
                  <span className="font-semibold text-green-600">
                    {formatCurrency(mockPatient.insurance.deductibleMet)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining Benefits</span>
                  <span className="font-semibold">
                    {formatCurrency(mockPatient.insurance.remainingBenefits)}
                  </span>
                </div>
              </div>
              
              <div className="mt-4 text-xs text-muted-foreground">
                Last verified: {new Date(mockPatient.insurance.lastVerified).toLocaleDateString()}
              </div>
            </div>

            <Button className="w-full" variant="outline">
              Verify Eligibility
            </Button>
          </CardContent>
        </Card>

        {/* Financial Summary */}
        {canViewFinancial && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Financial
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium">Outstanding Balance</span>
                  <span className="text-2xl font-bold text-orange-600">
                    {formatCurrency(mockPatient.financial.balance)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm text-muted-foreground">Last Payment</span>
                  <div className="text-right">
                    <div className="font-semibold">
                      {formatCurrency(mockPatient.financial.lastPayment.amount)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(mockPatient.financial.lastPayment.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>

              <Button className="w-full">
                Collect Payment
              </Button>

              <Button className="w-full" variant="outline">
                View Payment History
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Clinical Information */}
        {canViewClinical && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Clinical Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Recent Procedures</h4>
                  <div className="space-y-3">
                    {mockPatient.clinical.lastProcedures.map((proc, index) => (
                      <div key={index} className="p-3 rounded-lg border">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{proc.procedure}</p>
                            <p className="text-sm text-muted-foreground">
                              {proc.provider}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(proc.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Treatment Plan</h4>
                  <div className="space-y-3">
                    {mockPatient.clinical.upcomingPlan.map((plan, index) => (
                      <div key={index} className="p-3 rounded-lg border bg-accent/50">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{plan.procedure}</p>
                            <p className="text-sm text-muted-foreground">
                              Est. {formatCurrency(plan.estimatedCost)}
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            Schedule
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button variant="outline">View Full Records</Button>
                <Button variant="outline">View X-Rays</Button>
                <Button variant="outline">Add Note</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {mockPatient.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg border">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    {activity.type === 'call' ? (
                      <Phone className="h-5 w-5 text-primary" />
                    ) : (
                      <Mail className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{activity.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
