import React from 'react';
import './PlayerCard.css';

const ClubFifaCard = ({ club }) => {
  if (!club) return null;
  const {
    teamName,
    username,
    yearFounded,
    stadium,
    city,
    email
  } = club;

  // Imagen por defecto para el club
  const clubImage = `/images/Club/${teamName?.replace(/\s/g, '_')}/logo.png`;
  const fallbackImage = '/images/Logo.png';

  return (
    <div className="fifa-card club-fifa-card" style={{ margin: '0 auto', marginBottom: '2rem', maxWidth: 320 }}>
      <img
        src={clubImage}
        alt={teamName || username}
        className="fifa-player-image"
        onError={e => { e.target.onerror = null; e.target.src = fallbackImage; }}
        style={{ background: '#fff', border: '4px solid #FFC75F' }}
      />
      <h2 className="fifa-name" style={{ fontSize: '1.3rem', color: '#FFC75F' }}>{teamName || username}</h2>
      <p className="fifa-position" style={{ color: '#A3DB1F', fontWeight: 600 }}>@{username}</p>
      <ul className="fifa-characteristics" style={{ marginTop: 12 }}>
        <li><strong>Founded:</strong> {yearFounded || 'N/A'}</li>
        <li><strong>Stadium:</strong> {stadium || 'N/A'}</li>
        <li><strong>City:</strong> {city || 'N/A'}</li>
        <li><strong>Email:</strong> {email || 'N/A'}</li>
      </ul>
    </div>
  );
};

export default ClubFifaCard;
