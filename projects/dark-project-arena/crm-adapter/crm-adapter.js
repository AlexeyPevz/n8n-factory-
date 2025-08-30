/**
 * CRM Adapter for Dark Project Arena
 * Translates Bitrix24 API calls to custom CRM format
 */

class CRMAdapter {
  constructor(crmBaseUrl, apiKey) {
    this.baseUrl = crmBaseUrl;
    this.apiKey = apiKey;
    this.debug = process.env.DEBUG === 'true';
  }

  // Main method to translate Bitrix24 requests
  async translateBitrix24Request(method, params) {
    if (this.debug) {
      console.log(`Translating ${method} with params:`, params);
    }

    switch(method) {
      // Lead management
      case 'crm.lead.list':
        return this.searchLeads(params);
      case 'crm.lead.add':
        return this.createLead(params);
      case 'crm.lead.update':
        return this.updateLead(params);
      case 'crm.lead.get':
        return this.getLead(params);
      
      // Contact management
      case 'crm.contact.get':
        return this.getContact(params);
      
      // Deal management
      case 'crm.deal.get':
        return this.getDeal(params);
      
      // Task management
      case 'tasks.task.add':
        return this.createTask(params);
      
      // Activity management
      case 'crm.activity.add':
        return this.createActivity(params);
      
      default:
        throw new Error(`Unsupported method: ${method}`);
    }
  }

  // Search leads
  async searchLeads(bitrixParams) {
    const filter = {};
    const select = [];
    let limit = 50;
    let offset = 0;
    
    // Parse Bitrix24 parameters
    bitrixParams.forEach(param => {
      if (param.name.startsWith('filter[')) {
        const field = param.name.match(/filter\[(.*?)\]/)[1];
        filter[this.mapFieldName(field)] = param.value;
      } else if (param.name === 'select[]') {
        select.push(this.mapFieldName(param.value));
      } else if (param.name === 'limit') {
        limit = parseInt(param.value);
      } else if (param.name === 'start') {
        offset = parseInt(param.value);
      }
    });

    // Make request to custom CRM
    const response = await this.makeRequest('/api/leads/search', {
      filter,
      select: select.length > 0 ? select : undefined,
      limit,
      offset
    });

    // Transform response back to Bitrix24 format
    return {
      result: response.data.map(lead => this.mapLeadToB24Format(lead)),
      total: response.total || response.data.length,
      next: response.next || (offset + limit < response.total ? offset + limit : undefined)
    };
  }

  // Create new lead
  async createLead(bitrixParams) {
    let fields = {};
    
    // Extract fields from parameters
    bitrixParams.forEach(param => {
      if (param.name === 'fields') {
        fields = typeof param.value === 'string' ? JSON.parse(param.value) : param.value;
      }
    });

    // Transform to custom CRM format
    const leadData = this.mapB24LeadToCustomFormat(fields);
    
    // Create lead in custom CRM
    const response = await this.makeRequest('/api/leads/create', leadData, 'POST');
    
    // Return Bitrix24 format response
    return {
      result: response.id,
      time: {
        start: Date.now() / 1000,
        finish: Date.now() / 1000,
        duration: 0,
        processing: 0
      }
    };
  }

  // Update existing lead
  async updateLead(bitrixParams) {
    let leadId = null;
    let fields = {};
    
    // Extract parameters
    bitrixParams.forEach(param => {
      if (param.name === 'id') {
        leadId = param.value;
      } else if (param.name === 'fields') {
        fields = typeof param.value === 'string' ? JSON.parse(param.value) : param.value;
      }
    });

    if (!leadId) {
      throw new Error('Lead ID is required for update');
    }

    // Transform to custom CRM format
    const updateData = this.mapB24LeadToCustomFormat(fields);
    
    // Update lead in custom CRM
    await this.makeRequest(`/api/leads/${leadId}/update`, updateData, 'POST');
    
    // Return Bitrix24 format response
    return {
      result: true,
      time: {
        start: Date.now() / 1000,
        finish: Date.now() / 1000
      }
    };
  }

  // Get lead by ID
  async getLead(bitrixParams) {
    let leadId = null;
    
    bitrixParams.forEach(param => {
      if (param.name === 'id') {
        leadId = param.value;
      }
    });

    if (!leadId) {
      throw new Error('Lead ID is required');
    }

    const response = await this.makeRequest(`/api/leads/${leadId}`, null, 'GET');
    
    return {
      result: this.mapLeadToB24Format(response),
      time: {
        start: Date.now() / 1000,
        finish: Date.now() / 1000
      }
    };
  }

  // Create task
  async createTask(bitrixParams) {
    let fields = {};
    
    bitrixParams.forEach(param => {
      if (param.name === 'fields') {
        fields = typeof param.value === 'string' ? JSON.parse(param.value) : param.value;
      }
    });

    const taskData = {
      title: fields.TITLE,
      description: fields.DESCRIPTION,
      responsible_id: fields.RESPONSIBLE_ID,
      deadline: fields.DEADLINE,
      entity_type: fields.UF_CRM_TASK ? 'lead' : null,
      entity_id: fields.UF_CRM_TASK ? fields.UF_CRM_TASK[0].replace('L_', '') : null
    };

    const response = await this.makeRequest('/api/tasks/create', taskData, 'POST');
    
    return {
      result: {
        task: {
          id: response.id
        }
      }
    };
  }

  // Field mapping from Bitrix24 to custom CRM
  mapFieldName(b24Field) {
    const fieldMap = {
      // Standard fields
      'ID': 'id',
      'TITLE': 'title',
      'STATUS_ID': 'status',
      'PHONE': 'phone',
      'EMAIL': 'email',
      'COMMENTS': 'comments',
      'ADDRESS': 'address',
      'ADDRESS_CITY': 'city',
      'SOURCE_ID': 'source',
      'SOURCE_DESCRIPTION': 'source_description',
      
      // Custom fields
      'UF_CRM_TELEGRAM': 'telegram',
      'UF_CRM_TELEGRAM_ID': 'telegram_id',
      'UF_CRM_WHATSAPP': 'whatsapp',
      'UF_CRM_VK': 'vk',
      'UF_CRM_INSTAGRAM': 'instagram',
      'UF_CRM_WEBSITE': 'website',
      'UF_CRM_IS_CHAIN': 'is_chain',
      'UF_CRM_BRAND': 'brand',
      'UF_CRM_BRANCH_COUNT': 'branch_count',
      'UF_CRM_ESTIMATED_PCS': 'estimated_pcs',
      'UF_CRM_PRIORITY': 'priority',
      'UF_CRM_LEAD_SCORE': 'lead_score',
      'UF_CRM_DIALOG_HISTORY': 'dialog_history',
      'UF_CRM_LAST_CONTACT': 'last_contact',
      'UF_CRM_CONTACT_COUNT': 'contact_count',
      'UF_CRM_PREFERRED_CHANNEL': 'preferred_channel',
      'UF_CRM_ENRICHED_AT': 'enriched_at'
    };
    
    return fieldMap[b24Field] || b24Field.toLowerCase();
  }

  // Convert lead from custom CRM to Bitrix24 format
  mapLeadToB24Format(lead) {
    const b24Lead = {
      ID: lead.id,
      TITLE: lead.title,
      STATUS_ID: this.mapStatus(lead.status),
      COMMENTS: lead.comments || '',
      ADDRESS: lead.address || '',
      ADDRESS_CITY: lead.city || '',
      SOURCE_ID: lead.source || 'WEB',
      SOURCE_DESCRIPTION: lead.source_description || ''
    };

    // Map phone numbers
    if (lead.phone) {
      b24Lead.PHONE = Array.isArray(lead.phone) 
        ? lead.phone 
        : [{ VALUE: lead.phone, VALUE_TYPE: 'WORK' }];
    }

    // Map emails
    if (lead.email) {
      b24Lead.EMAIL = Array.isArray(lead.email)
        ? lead.email
        : [{ VALUE: lead.email, VALUE_TYPE: 'WORK' }];
    }

    // Map custom fields
    if (lead.custom_fields || lead.telegram || lead.whatsapp) {
      const cf = lead.custom_fields || {};
      b24Lead.UF_CRM_TELEGRAM = cf.telegram || lead.telegram || '';
      b24Lead.UF_CRM_TELEGRAM_ID = cf.telegram_id || lead.telegram_id || '';
      b24Lead.UF_CRM_WHATSAPP = cf.whatsapp || lead.whatsapp || '';
      b24Lead.UF_CRM_VK = cf.vk || lead.vk || '';
      b24Lead.UF_CRM_INSTAGRAM = cf.instagram || lead.instagram || '';
      b24Lead.UF_CRM_WEBSITE = cf.website || lead.website || '';
      b24Lead.UF_CRM_IS_CHAIN = (cf.is_chain || lead.is_chain) ? 'Y' : 'N';
      b24Lead.UF_CRM_BRAND = cf.brand || lead.brand || '';
      b24Lead.UF_CRM_BRANCH_COUNT = cf.branch_count || lead.branch_count || 0;
      b24Lead.UF_CRM_ESTIMATED_PCS = cf.estimated_pcs || lead.estimated_pcs || 0;
      b24Lead.UF_CRM_PRIORITY = cf.priority || lead.priority || 5;
      b24Lead.UF_CRM_LEAD_SCORE = cf.lead_score || lead.lead_score || 0;
      b24Lead.UF_CRM_DIALOG_HISTORY = cf.dialog_history || lead.dialog_history || '[]';
      b24Lead.UF_CRM_LAST_CONTACT = cf.last_contact || lead.last_contact || '';
      b24Lead.UF_CRM_CONTACT_COUNT = cf.contact_count || lead.contact_count || 0;
      b24Lead.UF_CRM_PREFERRED_CHANNEL = cf.preferred_channel || lead.preferred_channel || '';
      b24Lead.UF_CRM_ENRICHED_AT = cf.enriched_at || lead.enriched_at || '';
    }

    return b24Lead;
  }

  // Convert lead from Bitrix24 to custom CRM format
  mapB24LeadToCustomFormat(b24Lead) {
    const lead = {
      title: b24Lead.TITLE,
      status: this.mapStatusToCustom(b24Lead.STATUS_ID),
      comments: b24Lead.COMMENTS,
      address: b24Lead.ADDRESS,
      city: b24Lead.ADDRESS_CITY,
      source: b24Lead.SOURCE_ID,
      source_description: b24Lead.SOURCE_DESCRIPTION
    };

    // Map phone numbers
    if (b24Lead.PHONE) {
      lead.phone = Array.isArray(b24Lead.PHONE) 
        ? b24Lead.PHONE.map(p => ({ value: p.VALUE, type: p.VALUE_TYPE }))
        : [{ value: b24Lead.PHONE, type: 'work' }];
    }

    // Map emails
    if (b24Lead.EMAIL) {
      lead.email = Array.isArray(b24Lead.EMAIL)
        ? b24Lead.EMAIL.map(e => ({ value: e.VALUE, type: e.VALUE_TYPE }))
        : [{ value: b24Lead.EMAIL, type: 'work' }];
    }

    // Map custom fields
    lead.custom_fields = {
      telegram: b24Lead.UF_CRM_TELEGRAM,
      telegram_id: b24Lead.UF_CRM_TELEGRAM_ID,
      whatsapp: b24Lead.UF_CRM_WHATSAPP,
      vk: b24Lead.UF_CRM_VK,
      instagram: b24Lead.UF_CRM_INSTAGRAM,
      website: b24Lead.UF_CRM_WEBSITE,
      is_chain: b24Lead.UF_CRM_IS_CHAIN === 'Y',
      brand: b24Lead.UF_CRM_BRAND,
      branch_count: parseInt(b24Lead.UF_CRM_BRANCH_COUNT) || 0,
      estimated_pcs: parseInt(b24Lead.UF_CRM_ESTIMATED_PCS) || 0,
      priority: parseInt(b24Lead.UF_CRM_PRIORITY) || 5,
      lead_score: parseInt(b24Lead.UF_CRM_LEAD_SCORE) || 0,
      dialog_history: b24Lead.UF_CRM_DIALOG_HISTORY,
      last_contact: b24Lead.UF_CRM_LAST_CONTACT,
      contact_count: parseInt(b24Lead.UF_CRM_CONTACT_COUNT) || 0,
      preferred_channel: b24Lead.UF_CRM_PREFERRED_CHANNEL,
      enriched_at: b24Lead.UF_CRM_ENRICHED_AT
    };

    return lead;
  }

  // Map status from custom CRM to Bitrix24
  mapStatus(status) {
    const statusMap = {
      'new': 'NEW',
      'in_progress': 'IN_PROGRESS',
      'processed': 'PROCESSED',
      'converted': 'CONVERTED',
      'junk': 'JUNK'
    };
    return statusMap[status] || status.toUpperCase();
  }

  // Map status from Bitrix24 to custom CRM
  mapStatusToCustom(b24Status) {
    const statusMap = {
      'NEW': 'new',
      'IN_PROGRESS': 'in_progress',
      'PROCESSED': 'processed',
      'CONVERTED': 'converted',
      'JUNK': 'junk'
    };
    return statusMap[b24Status] || b24Status.toLowerCase();
  }

  // Make HTTP request to custom CRM
  async makeRequest(endpoint, data = null, method = 'POST') {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    if (this.debug) {
      console.log(`Making request to ${url}:`, options);
    }

    try {
      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return responseData;
    } catch (error) {
      console.error(`Error in CRM request:`, error);
      throw error;
    }
  }
}

module.exports = CRMAdapter;