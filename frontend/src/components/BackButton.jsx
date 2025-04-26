import React from 'react';
import { Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';

const BackButton = ({ className }) => {
  const navigate = useNavigate();

  return (
    <Button
      variant="outline-secondary"
      onClick={() => navigate(-1)}
      className={className}
    >
      <FiArrowLeft className="me-2" />
      Back
    </Button>
  );
};

export default BackButton; 