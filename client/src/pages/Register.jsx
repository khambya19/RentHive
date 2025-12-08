import React from 'react';
import LessorRegistrationForm from '../components/LessorRegistrationFormFixed';

const Register = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f9f9f9' }}>
      <div style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 16px rgba(0,0,0,0.08)' }}>
        <LessorRegistrationForm />
      </div>
    </div>
  );
};

export default Register;
