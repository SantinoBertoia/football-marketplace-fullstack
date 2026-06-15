import { apiUrl, USE_MOCK_API } from '../config/api';
import { publicPlayersMock } from '../mocks/publicPlayers';

export const fetchPublicPlayers = async () => {
  if (USE_MOCK_API) {
    return publicPlayersMock;
  }

  const response = await fetch(apiUrl('/players/public'));

  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }

  return response.json();
};
