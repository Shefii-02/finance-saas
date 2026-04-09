import { useEffect, useState } from 'react';
import apiClient from '../api/client';
import StatusCard from '../components/StatusCard';

const metrics = [
  {
    title: 'MRR',
    value: '$42,580',
    description: 'Recurring revenue across active subscriptions.'
  },
  {
    title: 'Cash Flow',
    value: '+12.4%',
    description: 'Month-over-month operating cash movement.'
  },
  {
    title: 'Churn Risk',
    value: '4 Accounts',
    description: 'Customers flagged for intervention this week.'
  }
];

function DashboardPage() {
  const [health, setHealth] = useState({ loading: true, status: 'Checking API...' });

  useEffect(() => {
    async function fetchHealth() {
      try {
        const { data } = await apiClient.get('/health');
        setHealth({
          loading: false,
          status: data.data.database === 'connected' ? 'API + DB online' : 'API online, DB degraded'
        });
      } catch (error) {
        setHealth({ loading: false, status: 'Backend unavailable' });
      }
    }

    fetchHealth();
  }, []);

  return (
    <main className="dashboard">
      <section className="hero">
        <div>
          <p className="eyebrow">Finance SaaS</p>
          <h1>Run subscriptions, revenue, and risk from one control center.</h1>
          <p className="hero-copy">
            This starter gives us a clean operational base for billing analytics, customer health,
            and internal finance workflows.
          </p>
        </div>
        <div className="hero-panel">
          <span className="hero-panel__status">System status</span>
          <strong>{health.status}</strong>
          <p>Frontend served by Vite, API powered by Express, data backed by MySQL.</p>
        </div>
      </section>

      <section className="metrics-grid">
        {metrics.map((metric) => (
          <StatusCard key={metric.title} {...metric} />
        ))}
      </section>
    </main>
  );
}

export default DashboardPage;
