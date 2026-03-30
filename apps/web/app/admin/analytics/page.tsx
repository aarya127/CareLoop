import dynamic from 'next/dynamic';

const PracticeKpiDashboard = dynamic(
  () => import('@/components/analytics/practice-kpi-dashboard').then((m) => ({ default: m.PracticeKpiDashboard })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 text-gray-400 animate-pulse">
        Loading analytics…
      </div>
    ),
  }
);

export default function AdminAnalyticsPage() {
  return <PracticeKpiDashboard />;
}
