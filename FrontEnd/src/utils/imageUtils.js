/**
 * Utilidades para manejar las imágenes de jugadores
 */

import { API_BASE_URL } from '../config/api';

/**
 * Genera la URL correcta para la imagen de un jugador
 * @param {Object} player - El objeto jugador
 * @returns {string} - La URL de la imagen
 */
export const getPlayerImageUrl = (player) => {
  if (!player) {
    return '/images/default-player.png';
  }

  // Si el jugador tiene una imagen personalizada almacenada en el backend
  if (player.image && player.image.startsWith('/images/players/')) {
    const imagePath = player.image.replace('/images/players/', '');
    const [playerId, fileName] = imagePath.split('/');
    return `${API_BASE_URL}/players/image/${playerId}/${fileName}`;
  }

  // Si la imagen es una URL externa (como las de placeholder)
  if (player.image && (player.image.startsWith('http') || player.image.startsWith('https'))) {
    return player.image;
  }

  // Si la imagen es una ruta local del frontend
  if (player.image && player.image.startsWith('/images/')) {
    return player.image;
  }

  // Imagen por defecto
  return '/images/default-player.png';
};

/**
 * Genera una imagen placeholder basada en el ID del jugador
 * @param {number} playerId - ID del jugador
 * @returns {string} - URL de la imagen placeholder
 */
export const getPlaceholderImageUrl = (playerId) => {
  // Usar una imagen de placeholder basada en el ID
  const placeholderIndex = (playerId % 20) + 1; // 20 imágenes diferentes
  return `https://randomuser.me/api/portraits/men/${placeholderIndex}.jpg`;
};

/**
 * Maneja errores de carga de imagen
 * @param {Event} event - Evento de error de imagen
 * @param {number} playerId - ID del jugador (opcional)
 */
export const handleImageError = (event, playerId = null) => {
  const img = event.target;
  
  // Si ya intentamos el placeholder, usar imagen por defecto
  if (img.src.includes('randomuser.me') || img.src.includes('default-player.png')) {
    img.src = '/images/default-player.png';
    return;
  }

  // Intentar con placeholder si tenemos el ID del jugador
  if (playerId) {
    img.src = getPlaceholderImageUrl(playerId);
  } else {
    img.src = '/images/default-player.png';
  }
};
