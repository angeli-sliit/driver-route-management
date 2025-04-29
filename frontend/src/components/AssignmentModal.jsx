import React, { useState } from 'react';
import { Modal, Button, Form, Spinner } from 'react-bootstrap';
import useFormValidation from '../hooks/useFormValidation';

const AssignmentModal = ({ show, onHide, date, assignPickupsToDrivers, pendingPickupsCount, availableDriversCount, fuelPrice }) => {
    const {
        values,
        handleChange,
        isSubmitting,
        setIsSubmitting
    } = useFormValidation(
        { useEnhancedOptimization: false },
        {}
    );

    const handleAssign = async () => {
        setIsSubmitting(true);
        try {
            await assignPickupsToDrivers(values.useEnhancedOptimization);
            onHide();
        } catch (error) {
            toast.error(error.message || 'Failed to assign pickups');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton className="bg-light">
                <Modal.Title>
                    <i className="bi bi-exclamation-triangle-fill text-warning me-2"></i>
                    Confirm Pickup Assignment
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* Summary Section */}
                <div className="mb-3 p-2 bg-light border rounded">
                    <div><strong>Pending Pickups:</strong> {pendingPickupsCount}</div>
                    <div><strong>Available Drivers:</strong> {availableDriversCount}</div>
                    <div><strong>Fuel Price:</strong> LKR {fuelPrice || 'N/A'}</div>
                </div>
                <div className="alert alert-warning">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    This action will automatically assign pickups based on:
                    <ul className="mt-2 mb-0">
                        <li>Driver availability status</li>
                        <li>Vehicle capacity constraints</li>
                        <li>Optimal fuel efficiency</li>
                    </ul>
                </div>
                <p className="lead">
                    Are you sure you want to optimize and assign pickups for <strong>{date || 'selected date'}</strong>?
                </p>
                <Form.Check
                    type="checkbox"
                    id="useEnhancedOptimization"
                    name="useEnhancedOptimization"
                    label="Use enhanced optimization (includes time windows and improved route planning)"
                    checked={values.useEnhancedOptimization}
                    onChange={handleChange}
                    className="mt-3"
                />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={isSubmitting}>
                    <i className="bi bi-x-circle me-2"></i>
                    Cancel
                </Button>
                <Button 
                    variant="primary" 
                    onClick={handleAssign}
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
                            Assigning...
                        </>
                    ) : (
                        <>
                            <i className="bi bi-check2-circle me-2"></i>
                            Confirm Assignment
                        </>
                    )}
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AssignmentModal; 