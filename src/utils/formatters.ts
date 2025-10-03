export const formatCPF = (cpf: string): string => {
  const cleaned = cpf.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{3})(\d{2})$/);
  if (match) {
    return `${match[1]}.${match[2]}.${match[3]}-${match[4]}`;
  }
  return cpf;
};

export const maskCPF = (cpf: string): string => {
  const formatted = formatCPF(cpf);
  if (formatted.length === 14) {
    return `***.***. ${formatted.slice(8)}`;
  }
  return formatted;
};

export const formatCEP = (cep: string): string => {
  const cleaned = cep.replace(/\D/g, '');
  const match = cleaned.match(/^(\d{5})(\d{3})$/);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  return cep;
};

export const formatAddress = (address: {
  street_address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}): string => {
  const parts = [];
  
  if (address.street_address) {
    let streetPart = address.street_address;
    if (address.number) {
      streetPart += `, ${address.number}`;
    }
    if (address.complement) {
      streetPart += ` - ${address.complement}`;
    }
    parts.push(streetPart);
  }
  
  if (address.neighborhood) {
    parts.push(address.neighborhood);
  }
  
  if (address.city && address.state) {
    parts.push(`${address.city} - ${address.state}`);
  } else if (address.city) {
    parts.push(address.city);
  } else if (address.state) {
    parts.push(address.state);
  }
  
  return parts.join(', ');
};

export const formatFullAddress = formatAddress;

export const applyCPFMask = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  let masked = cleaned;
  
  if (cleaned.length > 3) {
    masked = `${cleaned.slice(0, 3)}.${cleaned.slice(3)}`;
  }
  if (cleaned.length > 6) {
    masked = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6)}`;
  }
  if (cleaned.length > 9) {
    masked = `${cleaned.slice(0, 3)}.${cleaned.slice(3, 6)}.${cleaned.slice(6, 9)}-${cleaned.slice(9, 11)}`;
  }
  
  return masked;
};

export const applyCEPMask = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length > 5) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
  }
  return cleaned;
};
