/**
 * Barbershop Reservation Management - React Frontend
 * Simple, clean, and user-friendly interface
 */

import React, {useState, useEffect} from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [view, setView] = useState('book');
  const [barbers, setBarbers] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({text: '', type: ''});

  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    barberId: '',
    barberName: '',
    serviceType: 'haircut',
    appointmentDate: '',
    appointmentTime: '',
    price: 25.00,
  });

  const services = [
    {value: 'haircut', label: 'Haircut', price: 25, duration: 30},
    {value: 'shave', label: 'Shave', price: 15, duration: 20},
    {value: 'beard-trim', label: 'Beard Trim', price: 20, duration: 25},
    {value: 'full-service', label: 'Full Service', price: 45, duration: 60},
  ];

  useEffect(() => {
    fetchBarbers();
    if (view === 'list') {
      fetchReservations();
    }
  }, [view]);

  const fetchBarbers = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/barbers`);
      setBarbers(response.data.data);
    } catch (error) {
      showMessage('Failed to load barbers', 'error');
    }
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/reservations`);
      setReservations(response.data.data);
    } catch (error) {
      showMessage('Failed to load reservations', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async (barberId, date) => {
    try {
      const response = await axios.get(
          `${API_URL}/api/available-slots?barberId=${barberId}&date=${date}`
      );
      setAvailableSlots(response.data.availableSlots);
    } catch (error) {
      showMessage('Failed to load available slots', 'error');
    }
  };

  const handleInputChange = (e) => {
    const {name, value} = e.target;
    setFormData({...formData, [name]: value});

    if (name === 'barberId') {
      const selectedBarber = barbers.find((b) => b.id === value);
      setFormData((prev) => ({
        ...prev,
        barberName: selectedBarber ? selectedBarber.name : '',
      }));
    }

    if (name === 'serviceType') {
      const selectedService = services.find((s) => s.value === value);
      setFormData((prev) => ({
        ...prev,
        price: selectedService.price,
      }));
    }

    if (name === 'appointmentDate' && formData.barberId) {
      fetchAvailableSlots(formData.barberId, value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/reservations`, formData);
      showMessage('Reservation created successfully!', 'success');
      
      // Reset form
      setFormData({
        customerName: '',
        customerEmail: '',
        customerPhone: '',
        barberId: '',
        barberName: '',
        serviceType: 'haircut',
        appointmentDate: '',
        appointmentTime: '',
        price: 25.00,
      });
      setAvailableSlots([]);
    } catch (error) {
      showMessage(
          error.response?.data?.message || 'Failed to create reservation',
          'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancelReservation = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/reservations/${id}`);
      showMessage('Reservation cancelled successfully', 'success');
      fetchReservations();
    } catch (error) {
      showMessage('Failed to cancel reservation', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage({text, type});
    setTimeout(() => setMessage({text: '', type: ''}), 5000);
  };

  return (
      <div className="app">
        <header className="header">
          <h1>💈 Barbershop Reservation</h1>
          <nav>
            <button
                className={view === 'book' ? 'active' : ''}
                onClick={() => setView('book')}
            >
              Book Appointment
            </button>
            <button
                className={view === 'list' ? 'active' : ''}
                onClick={() => setView('list')}
            >
              View Reservations
            </button>
          </nav>
        </header>

        {message.text && (
            <div className={`message ${message.type}`}>
              {message.text}
            </div>
        )}

        <main className="main">
          {view === 'book' ? (
              <div className="booking-form">
                <h2>Book Your Appointment</h2>
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                        type="text"
                        name="customerName"
                        value={formData.customerName}
                        onChange={handleInputChange}
                        required
                        placeholder="John Doe"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Email *</label>
                      <input
                          type="email"
                          name="customerEmail"
                          value={formData.customerEmail}
                          onChange={handleInputChange}
                          required
                          placeholder="john@example.com"
                      />
                    </div>

                    <div className="form-group">
                      <label>Phone *</label>
                      <input
                          type="tel"
                          name="customerPhone"
                          value={formData.customerPhone}
                          onChange={handleInputChange}
                          required
                          placeholder="+1234567890"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Select Service *</label>
                    <select
                        name="serviceType"
                        value={formData.serviceType}
                        onChange={handleInputChange}
                        required
                    >
                      {services.map((service) => (
                          <option key={service.value} value={service.value}>
                            {service.label} - ${service.price} ({service.duration} min)
                          </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Select Barber *</label>
                    <select
                        name="barberId"
                        value={formData.barberId}
                        onChange={handleInputChange}
                        required
                    >
                      <option value="">Choose a barber...</option>
                      {barbers.map((barber) => (
                          <option key={barber.id} value={barber.id}>
                            {barber.name} - ⭐ {barber.rating}
                          </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Date *</label>
                      <input
                          type="date"
                          name="appointmentDate"
                          value={formData.appointmentDate}
                          onChange={handleInputChange}
                          required
                          min={new Date().toISOString().split('T')[0]}
                      />
                    </div>

                    <div className="form-group">
                      <label>Time *</label>
                      <select
                          name="appointmentTime"
                          value={formData.appointmentTime}
                          onChange={handleInputChange}
                          required
                          disabled={!availableSlots.length}
                      >
                        <option value="">
                          {availableSlots.length ? 'Choose time...' : 'Select date first'}
                        </option>
                        {availableSlots.map((slot) => (
                            <option key={slot} value={slot}>
                              {slot.substring(0, 5)}
                            </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="form-group price-info">
                    <strong>Total Price: ${formData.price}</strong>
                  </div>

                  <button
                      type="submit"
                      className="submit-btn"
                      disabled={loading}
                  >
                    {loading ? 'Booking...' : 'Book Appointment'}
                  </button>
                </form>
              </div>
          ) : (
              <div className="reservations-list">
                <h2>Your Reservations</h2>
                {loading ? (
                    <p className="loading">Loading reservations...</p>
                ) : reservations.length === 0 ? (
                    <p className="no-data">No reservations found</p>
                ) : (
                    <div className="reservations-grid">
                      {reservations.map((reservation) => (
                          <div
                              key={reservation.id}
                              className={`reservation-card ${reservation.status}`}
                          >
                            <div className="card-header">
                              <h3>{reservation.customerName}</h3>
                              <span className={`status-badge ${reservation.status}`}>
                              {reservation.status}
                            </span>
                            </div>
                            <div className="card-body">
                              <p>
                                <strong>Service:</strong> {reservation.serviceType}
                              </p>
                              <p>
                                <strong>Barber:</strong> {reservation.barberName}
                              </p>
                              <p>
                                <strong>Date:</strong> {reservation.appointmentDate}
                              </p>
                              <p>
                                <strong>Time:</strong>{' '}
                                {reservation.appointmentTime.substring(0, 5)}
                              </p>
                              <p>
                                <strong>Price:</strong> ${reservation.price}
                              </p>
                              <p>
                                <strong>Email:</strong> {reservation.customerEmail}
                              </p>
                            </div>
                            {reservation.status !== 'cancelled' && (
                                <button
                                    className="cancel-btn"
                                    onClick={() =>
                                      handleCancelReservation(reservation.id)
                                    }
                                >
                                  Cancel
                                </button>
                            )}
                          </div>
                      ))}
                    </div>
                )}
              </div>
          )}
        </main>

        <footer className="footer">
          <p>© 2025 Barbershop Reservation Management System</p>
          <p>Built with React + Node.js + PostgreSQL + Docker</p>
        </footer>
      </div>
  );
}

export default App;