import React from 'react';
import { useQuery } from '@apollo/client';
import { GET_MY_BIDS } from '../graphql/queries';
import { Link } from 'react-router-dom';

const formatMoney = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: Number(amount) % 1 === 0 ? 0 : 2,
  }).format(Number(amount));

const formatJobBudget = (job) => {
  if (job.budgetType === 'HOURLY') {
    return `${formatMoney(job.hourlyRateMin)}-${formatMoney(job.hourlyRateMax)}/hr`;
  }

  if (job.budgetType === 'FIXED') {
    return formatMoney(job.fixedBudget);
  }

  return 'Budget not set';
};

const MyBids = () => {
  const { data, loading, error } = useQuery(GET_MY_BIDS);

  if (loading) return <div style={{ padding: '20px' }}>Loading your bids...</div>;
  if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error.message}</div>;

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACCEPTED':
        return '#28a745';
      case 'REJECTED':
        return '#dc3545';
      default:
        return '#ffc107';
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1>My Bids</h1>
        <Link to="/dashboard" style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', textDecoration: 'none', borderRadius: '4px' }}>
          Back to Dashboard
        </Link>
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {data?.myBids?.map((bid) => (
          <div key={bid.id} style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', border: '1px solid #dee2e6' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
              <h3>{bid.job.title}</h3>
              <span style={{ padding: '4px 12px', backgroundColor: getStatusColor(bid.status), color: 'white', borderRadius: '4px', fontSize: '14px' }}>
                {bid.status}
              </span>
            </div>
            <p style={{ color: '#6c757d', marginBottom: '10px' }}>
              Job Budget: {formatJobBudget(bid.job)}
            </p>
            <p style={{ marginBottom: '10px' }}>
              <strong>Your Bid:</strong> ${bid.amount}
            </p>
            <p style={{ marginBottom: '10px' }}>
              <strong>Delivery Time:</strong> {bid.deliveryTime} days
            </p>
            <p style={{ color: '#495057' }}>
              <strong>Proposal:</strong> {bid.proposal}
            </p>
          </div>
        ))}
      </div>

      {(!data?.myBids || data.myBids.length === 0) && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
          You haven't placed any bids yet.
        </div>
      )}
    </div>
  );
};

export default MyBids;
