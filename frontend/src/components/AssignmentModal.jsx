import React, { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

const AssignmentModal = ({ show, onHide, date, assignPickupsToDrivers }) => {
    const [useEnhancedOptimization, setUseEnhancedOptimization] = useState(false);

    const handleAssign = () => {
        assignPickupsToDrivers(useEnhancedOptimization);
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
                <p className="lead">
                    Are you sure you want to optimize and assign pickups for <strong>{date || 'selected date'}</strong>?
                </p>
                <div className="alert alert-warning mt-3">
                    <i className="bi bi-info-circle-fill me-2"></i>
                    This action will automatically assign pickups based on:
                    <ul className="mt-2 mb-0">
                        <li>Driver availability status</li>
                        <li>Vehicle capacity constraints</li>
                        <li>Optimal fuel efficiency</li>
                    </ul>
                </div>
                <Form.Check
                    type="checkbox"
                    label="Use enhanced optimization (includes time windows and improved route planning)"
                    checked={useEnhancedOptimization}
                    onChange={(e) => setUseEnhancedOptimization(e.target.checked)}
                    className="mt-3"
                />
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    <i className="bi bi-x-circle me-2"></i>
                    Cancel
                </Button>
                <Button variant="primary" onClick={handleAssign}>
                    <i className="bi bi-check2-circle me-2"></i>
                    Confirm Assignment
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AssignmentModal; 