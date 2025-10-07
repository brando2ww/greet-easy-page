import { MAPBOX_TOKEN } from "@/config/mapbox";

export interface ViaCEPResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export interface AddressInfo {
  street: string;
  neighborhood: string;
  city: string;
  state: string;
  fullAddress: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
}

/**
 * Busca informações de endereço a partir do CEP usando a API ViaCEP
 */
export async function fetchAddressFromCEP(cep: string): Promise<AddressInfo | null> {
  try {
    // Remove formatação do CEP (apenas números)
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length !== 8) {
      throw new Error('CEP deve conter 8 dígitos');
    }

    const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar CEP');
    }

    const data: ViaCEPResponse = await response.json();
    
    if (data.erro) {
      return null;
    }

    return {
      street: data.logradouro,
      neighborhood: data.bairro,
      city: data.localidade,
      state: data.uf,
      fullAddress: `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`
    };
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
}

/**
 * Busca coordenadas (latitude e longitude) a partir do endereço completo usando Mapbox Geocoding API
 */
export async function fetchCoordinatesFromAddress(
  street: string,
  number: string,
  city: string,
  state: string,
  cep: string
): Promise<Coordinates | null> {
  try {
    // Monta a query de busca combinando todos os componentes do endereço
    const query = `${street} ${number}, ${city}, ${state}, ${cep}, Brasil`;
    const encodedQuery = encodeURIComponent(query);
    
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_TOKEN}&country=BR&limit=1`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar coordenadas');
    }

    const data = await response.json();
    
    if (!data.features || data.features.length === 0) {
      return null;
    }

    const [longitude, latitude] = data.features[0].center;
    
    return {
      latitude,
      longitude
    };
  } catch (error) {
    console.error('Erro ao buscar coordenadas:', error);
    return null;
  }
}
