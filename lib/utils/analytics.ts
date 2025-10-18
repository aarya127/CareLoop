// Analytics utility functions for the dashboard

import { Patient } from '../types/patient';

export interface AnalyticsData {
  totalClients: number;
  upcomingAppointments: number;
  outstandingBalances: number;
  averageVisitCost: number;
  insuranceCoverage: {
    covered: number;
    total: number;
    percentage: number;
  };
  mostFrequentProcedure: {
    name: string;
    count: number;
  };
}

export function calculateAnalytics(patients: Patient[]): AnalyticsData {
  const totalClients = patients.length;

  // Calculate upcoming appointments (next 7 days)
  const today = new Date();
  const sevenDaysFromNow = new Date();
  sevenDaysFromNow.setDate(today.getDate() + 7);

  // For now, we'll estimate based on average visit frequency
  // In production, this would come from actual appointment data
  const upcomingAppointments = Math.floor(totalClients * 0.15); // ~15% of clients have appointments this week

  // Calculate outstanding balances
  const outstandingBalances = patients.reduce(
    (sum, patient) => sum + patient.billing.outstandingBalance,
    0
  );

  // Calculate average visit cost
  let totalCost = 0;
  let totalVisits = 0;

  patients.forEach((patient) => {
    patient.visits.forEach((visit) => {
      totalCost += visit.totalCost;
      totalVisits++;
    });
  });

  const averageVisitCost = totalVisits > 0 ? totalCost / totalVisits : 0;

  // Calculate insurance coverage
  const patientsWithActiveCoverage = patients.filter((patient) => {
    const expiryDate = new Date(patient.insurance.policyExpiry);
    return expiryDate > today;
  }).length;

  const insuranceCoverage = {
    covered: patientsWithActiveCoverage,
    total: totalClients,
    percentage: totalClients > 0 ? (patientsWithActiveCoverage / totalClients) * 100 : 0,
  };

  // Find most frequent procedure
  const procedureCounts: Record<string, number> = {};

  patients.forEach((patient) => {
    patient.visits.forEach((visit) => {
      visit.procedures.forEach((procedure) => {
        procedureCounts[procedure.name] = (procedureCounts[procedure.name] || 0) + 1;
      });
    });
  });

  let mostFrequentProcedure = { name: 'N/A', count: 0 };
  Object.entries(procedureCounts).forEach(([name, count]) => {
    if (count > mostFrequentProcedure.count) {
      mostFrequentProcedure = { name, count };
    }
  });

  return {
    totalClients,
    upcomingAppointments,
    outstandingBalances,
    averageVisitCost,
    insuranceCoverage,
    mostFrequentProcedure,
  };
}

// Animated number counter utility
export function animateNumber(
  from: number,
  to: number,
  duration: number,
  callback: (value: number) => void
) {
  const startTime = Date.now();
  const step = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Ease-out cubic for smooth deceleration
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = from + (to - from) * easeOut;
    
    callback(Math.round(current));
    
    if (progress < 1) {
      requestAnimationFrame(step);
    }
  };
  
  requestAnimationFrame(step);
}
