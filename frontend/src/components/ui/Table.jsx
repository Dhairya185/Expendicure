import React from 'react';

export const Table = ({ children, className = '' }) => (
  <div className={`table-wrapper ${className}`}>
    <table className="table">{children}</table>
  </div>
);

export const TableHeader = ({ children }) => (
  <thead className="table-header">{children}</thead>
);

export const TableBody = ({ children }) => (
  <tbody className="table-body">{children}</tbody>
);

export const TableRow = ({ children, className = '' }) => (
  <tr className={`table-row ${className}`}>{children}</tr>
);

export const TableCell = ({ children, className = '', isHeader = false }) => {
  if (isHeader) return <th className={`table-cell table-cell-header ${className}`}>{children}</th>;
  return <td className={`table-cell ${className}`}>{children}</td>;
};

export default Table;
