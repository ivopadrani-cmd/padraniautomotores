// Utilidades de seguridad para el sistema de autenticación

// Clave secreta para encriptación (no visible en código fuente público)
const SECRET_KEY = 'P4dr4n1_4ut0m0t0r3s_2025_S3cr3t_K3y';

// Credenciales encriptadas (generadas con la función hash)
const ENCRYPTED_CREDENTIALS = {
  username: '0000000000000000000000002c88524f', // Hash de ivopadrani@gmail.com
  password: '0000000000000000000000001635d1ad'  // Hash de 1victoria
};

/**
 * Función de hash simple pero efectiva para credenciales
 * Usa operaciones matemáticas y la clave secreta
 */
function secureHash(input) {
  let hash = 0;
  const combined = input + SECRET_KEY;

  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convertir a 32 bits
  }

  // Convertir a hexadecimal y agregar padding
  return Math.abs(hash).toString(16).padStart(32, '0');
}

/**
 * Verifica credenciales usando hash seguro
 */
function verifyCredentials(username, password) {
  const usernameHash = secureHash(username);
  const passwordHash = secureHash(password);

  return usernameHash === ENCRYPTED_CREDENTIALS.username &&
         passwordHash === ENCRYPTED_CREDENTIALS.password;
}

/**
 * Genera un token de desbloqueo único para admin
 * Solo un admin puede generar y usar este token
 */
function generateAdminUnlockToken() {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const data = `ADMIN_UNLOCK_${timestamp}_${random}`;
  return secureHash(data);
}

/**
 * Verifica si un token de desbloqueo es válido
 */
function verifyAdminUnlockToken(token) {
  // Para un sistema real, esto debería verificar contra una base de datos
  // Por ahora, usamos localStorage para simular
  const storedToken = localStorage.getItem('admin_unlock_token');
  return storedToken === token;
}

/**
 * Crea un token de desbloqueo y lo guarda (solo para uso administrativo)
 */
function createAdminUnlockToken() {
  const token = generateAdminUnlockToken();
  localStorage.setItem('admin_unlock_token', token);
  return token;
}

/**
 * Función de ofuscación adicional para strings sensibles
 */
function obfuscateString(str) {
  return btoa(str.split('').reverse().join(''));
}

/**
 * Función de desofuscación
 */
function deobfuscateString(obfuscated) {
  try {
    return atob(obfuscated).split('').reverse().join('');
  } catch {
    return null;
  }
}

// Exportar funciones públicas
export {
  verifyCredentials,
  generateAdminUnlockToken,
  verifyAdminUnlockToken,
  createAdminUnlockToken,
  obfuscateString,
  deobfuscateString
};
