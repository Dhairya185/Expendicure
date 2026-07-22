import React from 'react';

const Select = ({ name, value, onChange, required, children, ...props }) => {
  return (
    <select
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="select"
      {...props}
    >
      {children}
    </select>
  );
};

export { Select };
export default Select;