import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PlayerCard from '../../components/PlayerCard/PlayerCard';
import './ClubDashboard.css';
import { apiUrl } from '../../config/api';

const ClubDashboard = () => {
  const { clubId } = useParams();
  const navigate = useNavigate();
  const [club, setClub] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOwnClub, setIsOwnClub] = useState(false);

  // Función para decodificar token
  const decodeToken = (token) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  };

  // Obtener el userId logueado
  const getLoggedUserId = () => {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const decoded = decodeToken(token);
    return decoded && decoded.userId ? decoded.userId : null;
  };

  useEffect(() => {
    const fetchClubData = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');

        // Obtener información del club (usuario)
        const clubResponse = await fetch(apiUrl(`/users/${clubId}`), {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });

        if (!clubResponse.ok) {
          throw new Error(`Error fetching club details: ${clubResponse.status}`);
        }

        const clubData = await clubResponse.json();
        setClub(clubData);

        // Verificar si es el club propio
        const loggedUserId = getLoggedUserId();
        setIsOwnClub(loggedUserId && loggedUserId.toString() === clubId);

        // Obtener jugadores del club
        const playersResponse = await fetch(apiUrl(`/players/owner/${clubId}`), {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        });

        if (!playersResponse.ok) {
          throw new Error(`Error fetching club players: ${playersResponse.status}`);
        }

        const playersData = await playersResponse.json();
        setPlayers(playersData);

      } catch (err) {
        console.error('Error fetching club data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (clubId) {
      fetchClubData();
    }
  }, [clubId]);

  const handleManagePlayersClick = () => {
    navigate('/manage-my-players');
  };

  if (loading) return <div className="club-dashboard"><h2>Loading club...</h2></div>;
  if (error) return <div className="club-dashboard"><h2>Error: {error}</h2></div>;
  if (!club) return <div className="club-dashboard"><h2>Club not found</h2></div>;

  // Imagen del club
  const clubImage = `/images/Club/${club.teamName?.replace(/\s/g, '_')}/logo.png`;
  const fallbackImage = '/images/Logo.png';

  return (
    <div className="club-dashboard">
      <div className="club-header">
        <div className="club-info">
          <img
            src={clubImage}
            alt={club.teamName || club.username}
            className="club-logo"
            onError={e => { e.target.onerror = null; e.target.src = fallbackImage; }}
            style={{ width: 90, height: 90, borderRadius: '50%', background: '#fff', border: '4px solid #FFC75F', marginBottom: 16 }}
          />
          <h1 className="club-name">{club.teamName || club.clubName || club.username || 'Unknown Club'}</h1>
          <div className="club-details">
            <p><strong>Manager:</strong> {club.username}</p>
            <p><strong>Founded:</strong> {club.yearFounded || 'Unknown'}</p>
            <p><strong>Stadium:</strong> {club.stadium || 'Unknown'}</p>
            <p><strong>City:</strong> {club.city || 'Unknown'}</p>
            <p><strong>Email:</strong> {club.email || 'Unknown'}</p>
            <p><strong>Players:</strong> {players.length}</p>
            <p><strong>Players for sale:</strong> {players.filter(p => p.isForSale).length}</p>
          </div>
        </div>
        {isOwnClub && (
          <div className="club-actions">
            <button 
              className="manage-btn"
              onClick={handleManagePlayersClick}
            >
              Manage My Players
            </button>
          </div>
        )}
      </div>

      <div className="club-players-section">
        <h2>Squad</h2>
        {players.length === 0 ? (
          <p className="no-players">This club has no players yet.</p>
        ) : (
          <div className="players-grid">
            {players.map((player) => (
              <PlayerCard 
                key={player.id} 
                player={player} 
                compact={false}
              />
            ))}
          </div>
        )}
      </div>

      {!isOwnClub && (
        <div className="club-note">
          <p>This is {club.teamName || club.clubName || club.username}'s club dashboard. You can view their players but cannot edit them.</p>
        </div>
      )}
    </div>
  );
};

export default ClubDashboard;
