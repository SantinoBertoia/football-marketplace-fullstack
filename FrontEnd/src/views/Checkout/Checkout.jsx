import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Checkout.css';
import { apiUrl } from '../../config/api';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [cartItems, setCartItems] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Datos del formulario de pago
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardHolder: '',
    email: '',
    address: '',
    city: '',
    zipCode: ''
  });

  // Datos recibidos del carrito
  useEffect(() => {
    if (location.state?.cartItems && location.state?.userInfo) {
      setCartItems(location.state.cartItems);
      setUserInfo(location.state.userInfo);
    } else {
      // Si no hay datos, redirigir al carrito
      navigate('/cart');
    }
  }, [location.state, navigate]);

  // Calcular totales
  const subtotal = cartItems.reduce((acc, player) => acc + (player.price || 0), 0);
  const tax = subtotal * 0.1; // 10% de impuestos
  const total = subtotal + tax;

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Formatear número de tarjeta
  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  // Formatear fecha de expiración
  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{2,4}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 2) {
      parts.push(match.substring(i, i + 2));
    }
    if (parts.length > 1) {
      return parts.slice(0, 2).join('/');
    } else {
      return parts[0] || '';
    }
  };

  // Manejar cambios especiales para tarjeta
  const handleCardInputChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (name === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (name === 'cvv') {
      formattedValue = value.replace(/[^0-9]/g, '').slice(0, 4);
    }

    setPaymentData(prev => ({
      ...prev,
      [name]: formattedValue
    }));
  };

  // Validar formulario
  const validateForm = () => {
    const { cardNumber, expiryDate, cvv, cardHolder, email } = paymentData;
    
    if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
      setError('Please enter a valid card number');
      return false;
    }
    
    if (!expiryDate || expiryDate.length < 5) {
      setError('Please enter a valid expiry date (MM/YY)');
      return false;
    }
    
    if (!cvv || cvv.length < 3) {
      setError('Please enter a valid CVV');
      return false;
    }
    
    if (!cardHolder.trim()) {
      setError('Please enter the cardholder name');
      return false;
    }
    
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }

    return true;
  };

  // Procesar compra
  const handlePurchase = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Simular procesamiento de pago (aquí iría la integración con un procesador de pagos real)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Crear transacciones para cada jugador
      const transactionPromises = cartItems.map(async (player) => {
        const response = await fetch(apiUrl('/transactions/create-transfer'), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            sellerId: player.ownerId || player.owner?.id,
            buyerId: userInfo.id,
            playerId: player.id,
            total: player.price
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Error processing transfer for ${player.name}: ${errorText}`);
        }

        return await response.json();
      });

      await Promise.all(transactionPromises);

      // Limpiar carrito después de la compra exitosa
      const cartResponse = await fetch(apiUrl(`/shopping-carts/user/${userInfo.id}/active`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (cartResponse.ok) {
        const cart = await cartResponse.json();
        
        // Eliminar todos los items del carrito
        const clearPromises = cartItems.map(player => 
          fetch(apiUrl(`/cart-items/remove-from-cart?cartId=${cart.id}&playerId=${player.id}`), {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        );

        await Promise.all(clearPromises);
      }

      // Redirigir a una página de confirmación o dashboard
      navigate('/dashboard', { 
        state: { 
          successMessage: `Purchase completed! You have successfully acquired ${cartItems.length} player(s) for $${total.toLocaleString()}.` 
        }
      });

    } catch (error) {
      console.error('Error processing purchase:', error);
      setError(`Error processing purchase: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!cartItems.length) {
    return (
      <div className="checkout-container">
        <div className="checkout-content">
          <h2>No items to checkout</h2>
          <button onClick={() => navigate('/players')} className="btn-primary">
            Browse Players
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-container">
      <div className="checkout-content">
        <div className="checkout-header">
          <h1>Checkout</h1>
          <button onClick={() => navigate('/cart')} className="back-btn">
            ← Back to Cart
          </button>
        </div>

        <div className="checkout-body">
          {/* Order Summary */}
          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="order-items">
              {cartItems.map((player) => (
                <div key={player.id} className="order-item">
                  <img 
                    src={player.image || '/images/default-player.png'} 
                    alt={player.name}
                    className="order-item-image"
                  />
                  <div className="order-item-details">
                    <h3>{player.name}</h3>
                    <p>{player.position} • Rating: {player.rating}</p>
                  </div>
                  <div className="order-item-price">
                    ${player.price?.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="order-totals">
              <div className="total-line">
                <span>Subtotal:</span>
                <span>${subtotal.toLocaleString()}</span>
              </div>
              <div className="total-line">
                <span>Tax (10%):</span>
                <span>${tax.toLocaleString()}</span>
              </div>
              <div className="total-line total-final">
                <span>Total:</span>
                <span>${total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Form */}
          <div className="payment-form">
            <h2>Payment Information</h2>
            
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <form onSubmit={handlePurchase}>
              <div className="form-section">
                <h3>Card Details</h3>
                
                <div className="form-group">
                  <label>Card Number</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={paymentData.cardNumber}
                    onChange={handleCardInputChange}
                    placeholder="1234 5678 9012 3456"
                    maxLength="19"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Expiry Date</label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={paymentData.expiryDate}
                      onChange={handleCardInputChange}
                      placeholder="MM/YY"
                      maxLength="5"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>CVV</label>
                    <input
                      type="text"
                      name="cvv"
                      value={paymentData.cvv}
                      onChange={handleCardInputChange}
                      placeholder="123"
                      maxLength="4"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Cardholder Name</label>
                  <input
                    type="text"
                    name="cardHolder"
                    value={paymentData.cardHolder}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Billing Information</h3>
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={paymentData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    name="address"
                    value={paymentData.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input
                      type="text"
                      name="city"
                      value={paymentData.city}
                      onChange={handleInputChange}
                      placeholder="New York"
                    />
                  </div>
                  <div className="form-group">
                    <label>ZIP Code</label>
                    <input
                      type="text"
                      name="zipCode"
                      value={paymentData.zipCode}
                      onChange={handleInputChange}
                      placeholder="10001"
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="btn-purchase"
                >
                  {loading ? 'Processing...' : `Complete Purchase - $${total.toLocaleString()}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
