import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlayerImageUrl, handleImageError } from '../../utils/imageUtils';
import './PlayerCard.css';

const FifaPlayerCard = ({ player, compact = false }) => {
  const {
    name,
    lastName,
    position,
    rating,
    characteristics,
    price,
    isForSale,
    id,
    owner
  } = player || {};

  const navigate = useNavigate();
  const handleClick = () => {
    navigate(`/player/${id}`);
  };

  const handleClubClick = (e) => {
    e.stopPropagation(); // Evitar que se active el click del jugador
    if (owner?.id) {
      navigate(`/club/${owner.id}`);
    }
  };

  const displayName = name && lastName ? `${name} ${lastName}` : name || 'Unknown Player';

  return (
    <div className="fifa-card" onClick={handleClick} style={{ cursor: 'pointer' }}>
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
      <p className="fifa-club" onClick={handleClubClick} title="Click to view club">
        {player.clubName || owner?.clubName || owner?.teamName || 'Unknown Club'}
      </p>

      {!compact && owner && (
        <ul className="fifa-characteristics fifa-club-characteristics" style={{ marginBottom: 8 }}>
          {owner.teamName && <li><strong>Team:</strong> {owner.teamName}</li>}
          {owner.yearFounded && <li><strong>Founded:</strong> {owner.yearFounded}</li>}
          {owner.stadium && <li><strong>Stadium:</strong> {owner.stadium}</li>}
          {owner.city && <li><strong>City:</strong> {owner.city}</li>}
        </ul>
      )}

      {!compact && (
        <ul className="fifa-characteristics">
          {Array.isArray(characteristics) && characteristics.length > 0 &&
            characteristics.map((charac, index) => (
              <li key={index}>• {charac}</li>
            ))}
        </ul>
      )}

      <div className="fifa-price">${price}</div>
    </div>
  );
};

export default FifaPlayerCard;
