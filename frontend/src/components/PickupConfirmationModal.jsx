import React, { useState, useEffect } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import useFormValidation from '../hooks/useFormValidation';
import { pickupConfirmationValidationRules } from '../utils/validation';
import { toast } from 'react-hot-toast';

const PickupConfirmationModal = ({ show, onConfirm, onCancel, onClose, mode, image, setImage }) => {
  const [isLoading, setIsLoading] = useState(false);
  
  const {
    values,
    errors,
    touched,
    isSubmitting,
    setIsSubmitting,
    handleChange,
    handleBlur,
    validateForm,
    resetForm
  } = useFormValidation(
    {
      weight: '',
      amount: '',
      reason: ''
    },
    mode === 'confirm' 
      ? { weight: pickupConfirmationValidationRules.weight, amount: pickupConfirmationValidationRules.amount }
      : { reason: pickupConfirmationValidationRules.reason }
  );

  useEffect(() => {
    if (!show) {
      resetForm();
      setImage(null);
    }
  }, [show]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (mode === 'confirm') {
        if (!image) {
          toast.error('Please upload a proof image');
          return;
        }
        
        await onConfirm({
          weight: parseFloat(values.weight),
          amount: parseFloat(values.amount),
          image
        });
        toast.success('Pickup confirmed successfully!');
      } else {
        await onCancel(values.reason);
        toast.success('Pickup cancelled successfully!');
      }
      onClose();
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error(error.message || 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>
          {mode === 'confirm' ? '✅ Confirm Pickup' : '❌ Cancel Pickup'}
        </Modal.Title>
      </Modal.Header>
      
      <Form onSubmit={handleSubmit} noValidate>
        <Modal.Body>
          {mode === 'confirm' && (
            <>
              <Form.Group className="mb-3">
                <Form.Label>Total Weight (kg)</Form.Label>
                <Form.Control
                  type="number"
                  step="0.1"
                  name="weight"
                  placeholder="Enter weight in kilograms"
                  value={values.weight}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={touched.weight && errors.weight}
                />
                {touched.weight && errors.weight && (
                  <Form.Control.Feedback type="invalid">
                    {errors.weight}
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Amount Given (LKR)</Form.Label>
                <Form.Control
                  type="number"
                  step="1"
                  name="amount"
                  placeholder="Enter amount in LKR"
                  value={values.amount}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  isInvalid={touched.amount && errors.amount}
                />
                {touched.amount && errors.amount && (
                  <Form.Control.Feedback type="invalid">
                    {errors.amount}
                  </Form.Control.Feedback>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Upload Proof Image</Form.Label>
                <Form.Control
                  type="file"
                  onChange={(e) => setImage(e.target.files[0])}
                  accept="image/*"
                  isInvalid={touched.image && !image}
                />
                {touched.image && !image && (
                  <Form.Control.Feedback type="invalid">
                    Please upload a proof image
                  </Form.Control.Feedback>
                )}
                {image && (
                  <div className="mt-2">
                    <img
                      src={URL.createObjectURL(image)}
                      alt="Proof"
                      className="img-fluid"
                      style={{ maxHeight: '200px', objectFit: 'contain' }}
                    />
                    <Button 
                      variant="link" 
                      className="text-danger p-0 mt-2"
                      onClick={() => setImage(null)}
                    >
                      Remove image
                    </Button>
                  </div>
                )}
              </Form.Group>
            </>
          )}

          {mode === 'cancel' && (
            <Form.Group className="mb-3">
              <Form.Label>Reason for Cancellation</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="reason"
                placeholder="Explain why you can't complete this pickup"
                value={values.reason}
                onChange={handleChange}
                onBlur={handleBlur}
                isInvalid={touched.reason && errors.reason}
              />
              {touched.reason && errors.reason && (
                <Form.Control.Feedback type="invalid">
                  {errors.reason}
                </Form.Control.Feedback>
              )}
            </Form.Group>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Close
          </Button>
          <Button 
            variant={mode === 'confirm' ? 'success' : 'danger'}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Spinner
                  as="span"
                  animation="border"
                  size="sm"
                  role="status"
                  aria-hidden="true"
                  className="me-2"
                />
                Processing...
              </>
            ) : (
              mode === 'confirm' ? 'Confirm Pickup' : 'Cancel Pickup'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default PickupConfirmationModal;