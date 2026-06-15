import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlayerImageUrl, handleImageError } from '../../utils/imageUtils';
import './PlayerCard.css';
import './DashboardPlayerCard.css';

const DashboardPlayerCard = ({ 
  player, 
  onToggleSale, 
  onUpdatePrice, 
  onDeletePlayer,
  compact = false 
}) => {
  const {
    name,
    lastName,
    position,
    rating,
    characteristics,
    price,
    isForSale,
    id
  } = player || {};

  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [newPrice, setNewPrice] = useState(price || 0);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const displayName = name && lastName ? `${name} ${lastName}` : name || 'Unknown Player';

  const handleCardClick = (e) => {
    // Evitar navegación si se clickea en botones
    if (e.target.closest('.player-actions') || e.target.closest('.price-edit-form')) {
      e.stopPropagation();
      return;
    }
    navigate(`/player/${id}`);
  };

  const handleToggleSale = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await onToggleSale(id, !isForSale);
    } catch (error) {
      console.error('Error toggling sale status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceEdit = (e) => {
    e.stopPropagation();
    setIsEditingPrice(true);
    setNewPrice(price || 0);
  };

  const handlePriceSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (newPrice < 0) {
      alert('Price cannot be negative');
      return;
    }

    setLoading(true);
    try {
      await onUpdatePrice(id, newPrice);
      setIsEditingPrice(false);
    } catch (error) {
      console.error('Error updating price:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceCancel = (e) => {
    e.stopPropagation();
    setIsEditingPrice(false);
    setNewPrice(price || 0);
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete ${displayName} from your team?`)) {
      setLoading(true);
      try {
        await onDeletePlayer(id);
      } catch (error) {
        console.error('Error deleting player:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className={`fifa-card dashboard-card ${loading ? 'loading' : ''}`} 
         onClick={handleCardClick} 
         style={{ cursor: 'pointer' }}>
      
      <div className={`fifa-sale-badge ${isForSale ? 'for-sale' : 'not-for-sale'}`}>
        {isForSale ? 'FOR SALE' : 'NOT FOR SALE'}
      </div>
      
      <div className="fifa-rating">{rating}</div>
      
      <img 
        src={getPlayerImageUrl(player)} 
        alt={displayName} 
        className="fifa-player-image"
        onError={(e) => handleImageError(e, id)}
      />

      <h2 className="fifa-name">{displayName}</h2>
      <p className="fifa-position">{position}</p>

      {!compact && (
        <ul className="fifa-characteristics">
          {Array.isArray(characteristics) &&
            characteristics.map((charac, index) => (
              <li key={index}>• {charac}</li>
            ))}
        </ul>
      )}

      {/* Price Section */}
      <div className="fifa-price-section">
        {isEditingPrice ? (
          <form className="price-edit-form" onSubmit={handlePriceSubmit}>
            <input
              type="number"
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
              min="0"
              step="1000"
              className="price-input"
              autoFocus
              placeholder="Enter price"
            />
            <div className="price-edit-buttons">
              <button type="submit" className="btn-save" disabled={loading}>
                Save
              </button>
              <button type="button" onClick={handlePriceCancel} className="btn-cancel">
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="fifa-price">${price?.toLocaleString()}</div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="player-actions">
        <button 
          onClick={handleToggleSale}
          className={`btn-toggle-sale ${isForSale ? 'btn-remove-sale' : 'btn-put-sale'}`}
          disabled={loading}
          title={isForSale ? 'Remove from sale' : 'Put for sale'}
        >
          {isForSale ? '🚫 Remove Sale' : '💰 Put for Sale'}
        </button>
        
        <button 
          onClick={handlePriceEdit}
          className="btn-edit-price"
          disabled={loading || isEditingPrice}
          title="Edit price"
        >
          ✏️ Edit Price
        </button>
        
        <button 
          onClick={handleDelete}
          className="btn-delete"
          disabled={loading}
          title="Delete player"
        >
          🗑️ Delete
        </button>
      </div>

      {loading && (
        <div className="card-loading-overlay">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
};

export default DashboardPlayerCard;
