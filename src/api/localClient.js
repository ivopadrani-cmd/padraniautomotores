// Local API Client - Mock backend to replace Base44
// Uses localStorage for persistence

class LocalStorageDB {
  constructor() {
    this.prefix = 'local_db_';
  }

  getKey(entity) {
    return `${this.prefix}${entity}`;
  }

  getAll(entity) {
    const key = this.getKey(entity);
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }

  save(entity, data) {
    const key = this.getKey(entity);
    localStorage.setItem(key, JSON.stringify(data));
  }

  getNextId(entity) {
    const all = this.getAll(entity);
    if (all.length === 0) return '1';
    const maxId = Math.max(...all.map(item => parseInt(item.id) || 0));
    return String(maxId + 1);
  }
}

const db = new LocalStorageDB();

// Entity class to simulate Base44 entities
class Entity {
  constructor(name) {
    this.name = name;
  }

  async list(sort = null) {
    let items = db.getAll(this.name);
    
    if (sort) {
      const [field, direction] = sort.startsWith('-') 
        ? [sort.slice(1), 'desc'] 
        : [sort, 'asc'];
      
      items.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        if (aVal instanceof Date) aVal = aVal.getTime();
        if (bVal instanceof Date) bVal = bVal.getTime();
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return items;
  }

  async filter(filters = {}, sort = null) {
    let items = db.getAll(this.name);
    
    // Apply filters
    items = items.filter(item => {
      return Object.keys(filters).every(key => {
        const filterValue = filters[key];
        const itemValue = item[key];
        
        if (filterValue === undefined || filterValue === null) return true;
        if (itemValue === undefined || itemValue === null) return false;
        
        return String(itemValue) === String(filterValue);
      });
    });
    
    // Apply sorting
    if (sort) {
      const [field, direction] = sort.startsWith('-') 
        ? [sort.slice(1), 'desc'] 
        : [sort, 'asc'];
      
      items.sort((a, b) => {
        let aVal = a[field];
        let bVal = b[field];
        
        if (aVal instanceof Date) aVal = aVal.getTime();
        if (bVal instanceof Date) bVal = bVal.getTime();
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        
        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    
    return items;
  }

  async get(id) {
    const items = db.getAll(this.name);
    return items.find(item => item.id === id) || null;
  }

  async create(data) {
    const items = db.getAll(this.name);
    const newItem = {
      id: db.getNextId(this.name),
      ...data,
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString()
    };
    items.push(newItem);
    db.save(this.name, items);
    return newItem;
  }

  async update(id, data) {
    const items = db.getAll(this.name);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) throw new Error(`${this.name} with id ${id} not found`);
    
    items[index] = {
      ...items[index],
      ...data,
      updated_date: new Date().toISOString()
    };
    db.save(this.name, items);
    return items[index];
  }

  async delete(id) {
    const items = db.getAll(this.name);
    const filtered = items.filter(item => item.id !== id);
    db.save(this.name, filtered);
    return { success: true };
  }
}

// Helper function to ensure user has role property
function ensureUserRole(user) {
  if (!user.role) {
    user.role = 'Administrador'; // Default role
  }
  return user;
}

// Helper function to initialize default users
function initializeDefaultUsers() {
  const users = db.getAll('User');
  let needsSave = false;
  
  // Ensure ivopadrani@gmail.com exists with Gerente role
  const ivoUser = users.find(u => u.email?.toLowerCase() === 'ivopadrani@gmail.com');
  if (!ivoUser) {
    const newIvoUser = {
      id: db.getNextId('User'),
      email: 'ivopadrani@gmail.com',
      password: 'gerente123', // Default password, but login accepts any password
      full_name: 'Ivo Padrani',
      role: 'Gerente',
      created_date: new Date().toISOString()
    };
    users.push(newIvoUser);
    needsSave = true;
  } else if (ivoUser.role !== 'Gerente') {
    // Update existing user to have Gerente role
    ivoUser.role = 'Gerente';
    needsSave = true;
  }
  
  // Ensure default admin exists if no users
  if (users.length === 0) {
    const defaultUser = {
      id: '1',
      email: 'admin@example.com',
      password: 'admin123',
      full_name: 'Administrador',
      role: 'Administrador',
      created_date: new Date().toISOString()
    };
    users.push(defaultUser);
    needsSave = true;
  } else {
    // Ensure all existing users have a role
    users.forEach(user => {
      if (!user.role) {
        user.role = 'Administrador';
        needsSave = true;
      }
    });
  }
  
  if (needsSave) {
    db.save('User', users);
  }
  
  return users;
}

// Auth class
class Auth {
  constructor() {
    // Initialize default users on first access
    initializeDefaultUsers();
  }

  async me() {
    // Initialize default users first
    const users = initializeDefaultUsers();
    
    const userStr = localStorage.getItem('current_user');
    if (!userStr) {
      // Auto-login as ivopadrani@gmail.com if no user is logged in
      const ivoUser = users.find(u => u.email?.toLowerCase() === 'ivopadrani@gmail.com');
      if (ivoUser) {
        // Ensure role is Gerente
        if (ivoUser.role !== 'Gerente') {
          ivoUser.role = 'Gerente';
          const index = users.findIndex(u => u.id === ivoUser.id);
          if (index !== -1) {
            users[index] = ivoUser;
            db.save('User', users);
          }
        }
        localStorage.setItem('current_user', JSON.stringify(ivoUser));
        return {
          id: ivoUser.id,
          email: ivoUser.email,
          role: ivoUser.role,
          full_name: ivoUser.full_name,
          ...ivoUser
        };
      }
      return null;
    }
    
    const user = JSON.parse(userStr);
    
    // Special handling for ivopadrani@gmail.com - always ensure Gerente role
    if (user.email?.toLowerCase() === 'ivopadrani@gmail.com') {
      if (user.role !== 'Gerente') {
        user.role = 'Gerente';
        const dbUser = users.find(u => u.id === user.id || u.email?.toLowerCase() === 'ivopadrani@gmail.com');
        if (dbUser) {
          dbUser.role = 'Gerente';
          const index = users.findIndex(u => u.id === dbUser.id);
          if (index !== -1) {
            users[index] = dbUser;
            db.save('User', users);
          }
        }
        localStorage.setItem('current_user', JSON.stringify(user));
      }
      return {
        id: user.id,
        email: user.email,
        role: 'Gerente',
        full_name: user.full_name || 'Ivo Padrani',
        ...user
      };
    }
    
    // Ensure user has role
    const userWithRole = ensureUserRole(user);
    
    // If user doesn't have role in localStorage, update it from DB
    if (!user.role || user.role !== userWithRole.role) {
      const dbUser = users.find(u => u.id === user.id || u.email?.toLowerCase() === user.email?.toLowerCase());
      if (dbUser && dbUser.role) {
        user.role = dbUser.role;
        localStorage.setItem('current_user', JSON.stringify(user));
      } else {
        user.role = userWithRole.role;
        localStorage.setItem('current_user', JSON.stringify(user));
      }
    }
    
    // Always return user with email, id, and role
    return {
      id: user.id,
      email: user.email,
      role: user.role || userWithRole.role,
      full_name: user.full_name,
      ...user
    };
  }

  getCurrentUser() {
    return this.me();
  }

  async login(email, password) {
    // Initialize default users
    const users = initializeDefaultUsers();
    
    // Special case: ivopadrani@gmail.com accepts any password
    if (email?.toLowerCase() === 'ivopadrani@gmail.com') {
      let user = users.find(u => u.email?.toLowerCase() === 'ivopadrani@gmail.com');
      if (!user) {
        // Create if doesn't exist
        user = {
          id: db.getNextId('User'),
          email: 'ivopadrani@gmail.com',
          password: password || 'gerente123',
          full_name: 'Ivo Padrani',
          role: 'Gerente',
          created_date: new Date().toISOString()
        };
        users.push(user);
        db.save('User', users);
      }
      // Ensure role is Gerente
      if (user.role !== 'Gerente') {
        user.role = 'Gerente';
        const index = users.findIndex(u => u.id === user.id);
        if (index !== -1) {
          users[index] = user;
          db.save('User', users);
        }
      }
      localStorage.setItem('current_user', JSON.stringify(user));
      return {
        id: user.id,
        email: user.email,
        role: user.role,
        full_name: user.full_name,
        ...user
      };
    }
    
    // Normal authentication for other users
    const user = users.find(u => u.email?.toLowerCase() === email?.toLowerCase() && u.password === password);
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    // Ensure user has role
    const userWithRole = ensureUserRole(user);
    if (user.role !== userWithRole.role) {
      const index = users.findIndex(u => u.id === user.id);
      if (index !== -1) {
        users[index] = userWithRole;
        db.save('User', users);
      }
    }
    
    localStorage.setItem('current_user', JSON.stringify(userWithRole));
    return {
      id: userWithRole.id,
      email: userWithRole.email,
      role: userWithRole.role,
      full_name: userWithRole.full_name,
      ...userWithRole
    };
  }

  async logout() {
    localStorage.removeItem('current_user');
    window.location.href = '/';
  }

  async register(data) {
    const users = db.getAll('User');
    const newUser = {
      id: db.getNextId('User'),
      ...data,
      role: data.role || 'Administrador', // Ensure role is set
      created_date: new Date().toISOString()
    };
    users.push(newUser);
    db.save('User', users);
    localStorage.setItem('current_user', JSON.stringify(newUser));
    return {
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      full_name: newUser.full_name,
      ...newUser
    };
  }
}

// Integrations class (simplified)
class Integrations {
  constructor() {
    this.Core = {
      InvokeLLM: async (prompt) => {
        // Mock LLM response
        return { response: `Mock response for: ${prompt}` };
      },
      
      SendEmail: async (to, subject, body) => {
        console.log('Mock email sent:', { to, subject, body });
        return { success: true, messageId: 'mock-' + Date.now() };
      },
      
      UploadFile: async (file) => {
        // Convert file to base64 and store in localStorage
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const fileData = {
              id: 'file-' + Date.now(),
              name: file.name,
              type: file.type,
              size: file.size,
              data: reader.result,
              url: reader.result
            };
            const files = db.getAll('File');
            files.push(fileData);
            db.save('File', files);
            resolve(fileData);
          };
          reader.readAsDataURL(file);
        });
      },
      
      UploadPrivateFile: async (file) => {
        return this.UploadFile(file);
      },
      
      CreateFileSignedUrl: async (fileId) => {
        const files = db.getAll('File');
        const file = files.find(f => f.id === fileId);
        return file ? file.url : null;
      },
      
      ExtractDataFromUploadedFile: async (fileId) => {
        // Mock data extraction
        return { extracted: true, data: {} };
      },
      
      GenerateImage: async (prompt) => {
        // Mock image generation
        return { url: 'https://via.placeholder.com/512', id: 'img-' + Date.now() };
      }
    };
  }
}

// Create local client similar to Base44 structure
const authInstance = new Auth();

// Initialize default users on module load
initializeDefaultUsers();

export const localClient = {
  entities: {
    Vehicle: new Entity('Vehicle'),
    Client: new Entity('Client'),
    Sale: new Entity('Sale'),
    Transaction: new Entity('Transaction'),
    Service: new Entity('Service'),
    FinancialRecord: new Entity('FinancialRecord'),
    CalendarEvent: new Entity('CalendarEvent'),
    Lead: new Entity('Lead'),
    ContractTemplate: new Entity('ContractTemplate'),
    Contract: new Entity('Contract'),
    Document: new Entity('Document'),
    DocumentTemplate: new Entity('DocumentTemplate'),
    Consignment: new Entity('Consignment'),
    Seller: new Entity('Seller'),
    Reservation: new Entity('Reservation'),
    Quote: new Entity('Quote'),
    Branch: new Entity('Branch'),
    Task: new Entity('Task'),
    Spouse: new Entity('Spouse'),
    ClauseTemplate: new Entity('ClauseTemplate'),
    ExchangeRate: new Entity('ExchangeRate'),
    AgencySettings: new Entity('AgencySettings'),
    VehicleInspection: new Entity('VehicleInspection'),
  },
  auth: authInstance,
  integrations: new Integrations()
};

