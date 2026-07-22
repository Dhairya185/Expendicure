import React from 'react';

export const Statistic = ({ children }) => (
  <div className="statistic">{children}</div>
);

export const StatisticLabel = ({ children }) => (
  <div className="statistic-label">{children}</div>
);

export const StatisticValue = ({ children }) => (
  <div className="statistic-value">{children}</div>
);

export const StatisticTrend = ({ children, isPositive }) => (
  <div className={`statistic-trend ${isPositive ? 'positive' : 'negative'}`}>
    {children}
  </div>
);

export default Statistic;