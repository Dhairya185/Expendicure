import React from 'react';

const Input = ({ type, name, value, onChange, required, ...props }) => {
  return (
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      required={required}
      className="input"
      {...props}
    />
  );
};

export { Input };
export default Input;