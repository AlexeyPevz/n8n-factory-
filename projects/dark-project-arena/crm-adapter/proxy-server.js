/**
 * Proxy Server for Dark Project Arena
 * Emulates Bitrix24 webhook API for custom CRM integration
 */

const express = require('express');
const CRMAdapter = require('./crm-adapter');
const morgan = require('morgan');
const cors = require('cors');

// Initialize Express app
const app = express();

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(cors());

// Request logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Initialize CRM adapter
const adapter = new CRMAdapter(
  process.env.CUSTOM_CRM_URL || 'http://localhost:8080',
  process.env.CUSTOM_CRM_API_KEY || 'your-api-key'
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Dark Project Arena CRM Proxy',
    timestamp: new Date().toISOString()
  });
});

// Main proxy endpoint - emulates Bitrix24 webhook structure
app.post('/rest/:userId/:webhook/:method', async (req, res) => {
  const { method } = req.params;
  const startTime = Date.now();
  
  console.log(`Incoming request: ${method}`);
  
  try {
    // Extract parameters from request body
    const parameters = req.body.parameters || [];
    
    // Translate and execute request
    const result = await adapter.translateBitrix24Request(method, parameters);
    
    // Add timing information like Bitrix24 does
    if (!result.time) {
      result.time = {
        start: startTime / 1000,
        finish: Date.now() / 1000,
        duration: (Date.now() - startTime) / 1000,
        processing: (Date.now() - startTime) / 1000,
        date_start: new Date(startTime).toISOString(),
        date_finish: new Date().toISOString()
      };
    }
    
    res.json(result);
  } catch (error) {
    console.error(`Error processing ${method}:`, error);
    
    // Return Bitrix24-style error response
    res.status(400).json({
      error: error.code || 'ERROR_CORE',
      error_description: error.message || 'An error occurred processing your request'
    });
  }
});

// Alternative endpoint structure for flexibility
app.post('/api/bitrix24/:method', async (req, res) => {
  const { method } = req.params;
  
  try {
    const parameters = req.body.parameters || req.body || [];
    const result = await adapter.translateBitrix24Request(method, parameters);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: error.code || 'ERROR_CORE',
      error_description: error.message
    });
  }
});

// Batch operations endpoint (like Bitrix24 batch API)
app.post('/rest/:userId/:webhook/batch', async (req, res) => {
  const { cmd, halt } = req.body;
  const results = {};
  const errors = {};
  
  try {
    // Process commands sequentially or in parallel based on halt parameter
    const commands = Object.entries(cmd);
    
    if (halt) {
      // Sequential processing - stop on first error
      for (const [key, command] of commands) {
        try {
          const [method, params] = parseCommand(command);
          results[key] = await adapter.translateBitrix24Request(method, params);
        } catch (error) {
          errors[key] = {
            error: error.code || 'ERROR_CORE',
            error_description: error.message
          };
          break;
        }
      }
    } else {
      // Parallel processing - continue on errors
      await Promise.all(
        commands.map(async ([key, command]) => {
          try {
            const [method, params] = parseCommand(command);
            results[key] = await adapter.translateBitrix24Request(method, params);
          } catch (error) {
            errors[key] = {
              error: error.code || 'ERROR_CORE',
              error_description: error.message
            };
          }
        })
      );
    }
    
    res.json({
      result: {
        result: results,
        result_error: errors,
        result_total: Object.keys(results).length,
        result_next: {},
        result_time: {}
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'BATCH_ERROR',
      error_description: error.message
    });
  }
});

// Parse batch command
function parseCommand(command) {
  if (typeof command === 'string') {
    // Parse string command like "crm.lead.list?filter[PHONE]=123"
    const [method, queryString] = command.split('?');
    const params = [];
    
    if (queryString) {
      const urlParams = new URLSearchParams(queryString);
      for (const [key, value] of urlParams) {
        params.push({ name: key, value });
      }
    }
    
    return [method, params];
  } else {
    // Object format { method: 'crm.lead.list', params: {...} }
    return [command.method, objectToParams(command.params)];
  }
}

// Convert object to Bitrix24 parameter format
function objectToParams(obj) {
  const params = [];
  
  function processValue(key, value) {
    if (Array.isArray(value)) {
      value.forEach(v => params.push({ name: `${key}[]`, value: v }));
    } else if (typeof value === 'object' && value !== null) {
      Object.entries(value).forEach(([k, v]) => {
        processValue(`${key}[${k}]`, v);
      });
    } else {
      params.push({ name: key, value });
    }
  }
  
  Object.entries(obj).forEach(([key, value]) => {
    processValue(key, value);
  });
  
  return params;
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    error_description: 'An internal server error occurred'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'METHOD_NOT_FOUND',
    error_description: `Method not found: ${req.path}`
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Dark Project Arena CRM Proxy running on port ${PORT}`);
  console.log(`Proxying requests to: ${process.env.CUSTOM_CRM_URL || 'http://localhost:8080'}`);
  console.log(`Example webhook URL: http://localhost:${PORT}/rest/1/fake_webhook/`);
});