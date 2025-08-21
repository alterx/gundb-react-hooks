# useGunNamespace

A hook that creates or retrieves a namespaced Gun graph reference with enhanced error handling and type safety.

## API Reference

### Signature

```typescript
useGunNamespace(
  gun: IGunInstance, 
  soul?: string
): IGunReference
```

### Parameters

- `gun` - Gun instance to create namespace from
- `soul` - Optional soul/ID for specific namespace (generates new if not provided)

### Return Type

```typescript
IGunReference  // Namespaced Gun graph reference
```

## Basic Usage

### Auto-Generated Namespace

```typescript
import React from 'react';
import { useGun, useGunNamespace, useGunState } from '@altrx/gundb-react-hooks';
import Gun from 'gun';

export const NamespaceExample: React.FC = () => {
  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });
  
  // Create a new namespace with auto-generated soul
  const namespacedGraph = useGunNamespace(gun);
  
  // Use the namespace for state management
  const { 
    fields: userData, 
    put: updateUserData,
    error: userError 
  } = useGunState(namespacedGraph);

  const handleSaveData = async () => {
    try {
      await updateUserData({
        name: 'John Doe',
        preferences: { theme: 'dark', language: 'en' },
        lastUpdated: new Date().toISOString()
      });
      console.log('Data saved to namespace');
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  };

  if (userError) {
    return (
      <div className="namespace-error">
        <h3>Namespace Error</h3>
        <p>{userError.err}</p>
      </div>
    );
  }

  return (
    <div className="namespace-demo">
      <h3>Auto-Generated Namespace</h3>
      
      <div className="namespace-info">
        <p><strong>Namespace Soul:</strong> {namespacedGraph._.opt?.soul || 'Generating...'}</p>
        <p><strong>Data:</strong> {JSON.stringify(userData, null, 2)}</p>
      </div>

      <button onClick={handleSaveData}>
        Save Data to Namespace
      </button>
    </div>
  );
};
```

### Specific Namespace (Known Soul)

```typescript
import React, { useState } from 'react';
import { useGun, useGunNamespace, useGunState } from '@altrx/gundb-react-hooks';

export const SpecificNamespaceExample: React.FC = () => {
  const [targetSoul, setTargetSoul] = useState<string>('user_settings_12345');
  const [currentSoul, setCurrentSoul] = useState<string>(targetSoul);
  
  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });
  
  // Connect to specific namespace
  const namespacedGraph = useGunNamespace(gun, currentSoul);
  
  const { 
    fields: settings, 
    put: updateSettings,
    error: settingsError 
  } = useGunState(namespacedGraph);

  const switchNamespace = () => {
    setCurrentSoul(targetSoul);
  };

  const saveSettings = async () => {
    try {
      await updateSettings({
        theme: 'dark',
        notifications: true,
        autoSave: false,
        language: 'en-US',
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  };

  return (
    <div className="specific-namespace">
      <h3>Specific Namespace</h3>
      
      <div className="namespace-controls">
        <input
          type="text"
          placeholder="Enter namespace soul/ID"
          value={targetSoul}
          onChange={(e) => setTargetSoul(e.target.value)}
        />
        <button onClick={switchNamespace}>
          Switch to Namespace
        </button>
      </div>

      <div className="namespace-info">
        <p><strong>Current Namespace:</strong> {currentSoul}</p>
        <p><strong>Connected:</strong> {namespacedGraph ? 'Yes' : 'No'}</p>
      </div>

      {settingsError ? (
        <div className="error">
          <p>Error: {settingsError.err}</p>
        </div>
      ) : (
        <div className="settings-display">
          <h4>Settings Data:</h4>
          <pre>{JSON.stringify(settings, null, 2)}</pre>
          <button onClick={saveSettings}>
            Save Settings
          </button>
        </div>
      )}
    </div>
  );
};
```

## Advanced Usage

### Multi-Tenant Application

```typescript
import React, { useState, useEffect } from 'react';
import { useGun, useGunNamespace, useGunState } from '@altrx/gundb-react-hooks';

interface Tenant {
  id: string;
  name: string;
  namespace: string;
}

export const MultiTenantApp: React.FC = () => {
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [tenants] = useState<Tenant[]>([
    { id: '1', name: 'Company A', namespace: 'tenant_company_a' },
    { id: '2', name: 'Company B', namespace: 'tenant_company_b' },
    { id: '3', name: 'Company C', namespace: 'tenant_company_c' }
  ]);

  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });
  
  // Create namespace for selected tenant
  const tenantGraph = useGunNamespace(gun, selectedTenant?.namespace);
  
  const { 
    fields: tenantData, 
    put: updateTenantData,
    error: tenantError 
  } = useGunState(tenantGraph);

  const selectTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
  };

  const saveTenantData = async () => {
    if (!selectedTenant) return;
    
    try {
      await updateTenantData({
        tenantId: selectedTenant.id,
        name: selectedTenant.name,
        settings: {
          maxUsers: 100,
          features: ['analytics', 'reporting', 'api'],
          subscription: 'premium'
        },
        lastAccessed: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to save tenant data:', error);
    }
  };

  return (
    <div className="multi-tenant-app">
      <h3>Multi-Tenant Application</h3>
      
      <div className="tenant-selector">
        <h4>Select Tenant:</h4>
        {tenants.map(tenant => (
          <button
            key={tenant.id}
            onClick={() => selectTenant(tenant)}
            className={selectedTenant?.id === tenant.id ? 'active' : ''}
          >
            {tenant.name}
          </button>
        ))}
      </div>

      {selectedTenant ? (
        <div className="tenant-workspace">
          <h4>Tenant: {selectedTenant.name}</h4>
          <p><strong>Namespace:</strong> {selectedTenant.namespace}</p>
          
          {tenantError ? (
            <div className="error">
              <p>Error loading tenant data: {tenantError.err}</p>
            </div>
          ) : (
            <div className="tenant-data">
              <h5>Tenant Data:</h5>
              <pre>{JSON.stringify(tenantData, null, 2)}</pre>
              <button onClick={saveTenantData}>
                Save Tenant Data
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="no-tenant">
          <p>Please select a tenant to view their data</p>
        </div>
      )}
    </div>
  );
};
```

### Dynamic Namespace Creation

```typescript
import React, { useState } from 'react';
import { useGun, useGunNamespace, useGunCollectionState } from '@altrx/gundb-react-hooks';

interface Project {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export const ProjectManager: React.FC = () => {
  const [projects, setProjects] = useState<string[]>([]);
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });
  
  // Create namespace for selected project
  const projectGraph = useGunNamespace(gun, selectedProject || undefined);
  
  const { 
    collection: projectData, 
    addToCollection: addProjectData,
    error: projectError 
  } = useGunCollectionState<Project>(projectGraph);

  const createProject = () => {
    if (!newProjectName.trim()) return;
    
    const projectId = `project_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    setProjects(prev => [...prev, projectId]);
    setSelectedProject(projectId);
    setNewProjectName('');
    
    // Initialize project data
    setTimeout(() => {
      addProjectData({
        id: projectId,
        name: newProjectName,
        description: `Project ${newProjectName}`,
        createdAt: new Date().toISOString()
      });
    }, 100);
  };

  const selectProject = (projectId: string) => {
    setSelectedProject(projectId);
  };

  const addProjectItem = async () => {
    if (!selectedProject) return;
    
    try {
      await addProjectData({
        id: `item_${Date.now()}`,
        name: `Task ${Object.keys(projectData).length + 1}`,
        description: 'New project task',
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to add project item:', error);
    }
  };

  return (
    <div className="project-manager">
      <h3>Dynamic Project Namespaces</h3>
      
      <div className="project-creation">
        <h4>Create New Project:</h4>
        <input
          type="text"
          placeholder="Project name"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && createProject()}
        />
        <button onClick={createProject} disabled={!newProjectName.trim()}>
          Create Project
        </button>
      </div>

      <div className="project-list">
        <h4>Existing Projects:</h4>
        {projects.map(projectId => (
          <button
            key={projectId}
            onClick={() => selectProject(projectId)}
            className={selectedProject === projectId ? 'active' : ''}
          >
            {projectId.replace('project_', '').split('_')[1]} 
          </button>
        ))}
      </div>

      {selectedProject && (
        <div className="project-workspace">
          <h4>Project: {selectedProject}</h4>
          
          {projectError ? (
            <div className="error">
              <p>Error: {projectError.err}</p>
            </div>
          ) : (
            <div className="project-content">
              <div className="project-actions">
                <button onClick={addProjectItem}>
                  Add Task
                </button>
              </div>
              
              <div className="project-items">
                <h5>Project Items ({Object.keys(projectData).length}):</h5>
                {Object.entries(projectData).map(([key, item]) => (
                  <div key={key} className="project-item">
                    <h6>{item.name}</h6>
                    <p>{item.description}</p>
                    <small>Created: {new Date(item.createdAt).toLocaleDateString()}</small>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

## Best Practices

### Namespace Organization

```typescript
// Good: Use descriptive, hierarchical naming
const userNamespace = useGunNamespace(gun, `user_${userId}`);
const settingsNamespace = useGunNamespace(gun, `user_${userId}_settings`);
const chatNamespace = useGunNamespace(gun, `chat_${chatId}`);

// Avoid: Generic or unclear names
const namespace1 = useGunNamespace(gun, 'data');
const namespace2 = useGunNamespace(gun, 'stuff');
```

### Error Handling Pattern

```typescript
const NamespaceWithErrorHandling: React.FC = () => {
  const [soul, setSoul] = useState<string>('valid_namespace');
  const gun = useGun(Gun, { peers: ['http://localhost:8765/gun'] });
  
  const namespacedGraph = useGunNamespace(gun, soul);
  const { fields, error } = useGunState(namespacedGraph);

  // Monitor for namespace-related errors
  useEffect(() => {
    if (error?.context?.includes('namespace')) {
      console.error('Namespace error:', error);
      // Handle namespace-specific errors
    }
  }, [error]);

  return (
    <div>
      {error ? (
        <div className="namespace-error">
          <p>Namespace Error: {error.err}</p>
          <button onClick={() => setSoul(`fallback_${Date.now()}`)}>
            Create Fallback Namespace
          </button>
        </div>
      ) : (
        <div>
          <p>Namespace: {soul}</p>
          <pre>{JSON.stringify(fields, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};
```

## Migration from v0.9.x

### Before (v0.9.x)

```typescript
// Simple namespace creation without error handling
const namespacedGraph = useGunNamespace(gun);
const existingNamespace = useGunNamespace(gun, '~soul');

// No error handling for invalid souls or connection issues
```

### After (v1.0.0)

```typescript
// Enhanced namespace creation with proper error handling
const namespacedGraph = useGunNamespace(gun, soul);
const { fields, error } = useGunState(namespacedGraph);

// Comprehensive error handling
if (error?.context?.includes('namespace')) {
  // Handle namespace-specific errors
  return <NamespaceErrorComponent error={error} />;
}

// Validate namespace before use
if (namespacedGraph && !error) {
  // Safe to use namespace
}
```

## Use Cases

1. **Multi-tenant Applications** - Isolate data per tenant
2. **User Data Isolation** - Separate user-specific data
3. **Feature Modules** - Organize data by application features
4. **Environment Separation** - Different namespaces for dev/staging/prod
5. **Data Organization** - Logical grouping of related data
6. **Access Control** - Control access to specific data namespaces

## Security Considerations

- **Namespace Isolation**: Namespaces provide logical separation, not security isolation
- **Access Control**: Implement proper authentication and authorization
- **Soul Validation**: Validate namespace souls to prevent injection attacks
- **Data Encryption**: Use Gun's encryption features for sensitive data
- **Audit Trails**: Track namespace access and modifications

## Performance Tips

- **Reuse Namespaces**: Don't create new namespaces unnecessarily
- **Cache References**: Store namespace references for reuse
- **Cleanup**: Remove unused namespace subscriptions
- **Batch Operations**: Group related operations within the same namespace
