/**
 * DP_CRM Adapter for Dark Project Arena
 * Specific adapter for DP_CRM integration
 */

const CRMAdapter = require('./crm-adapter');

class DPCRMAdapter extends CRMAdapter {
  constructor(crmBaseUrl, apiKey) {
    super(crmBaseUrl, apiKey);
    this.crmType = 'DP_CRM';
  }

  // Override makeRequest to match DP_CRM authentication
  async makeRequest(endpoint, data = null, method = 'POST') {
    const url = `${this.baseUrl}${endpoint}`;
    const options = {
      method,
      headers: {
        // Adjust based on DP_CRM authentication method
        'Authorization': `Bearer ${this.apiKey}`,
        // or 'X-API-Key': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data);
    }

    if (this.debug) {
      console.log(`[DP_CRM] Making request to ${url}:`, options);
    }

    try {
      const response = await fetch(url, options);
      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || responseData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return responseData;
    } catch (error) {
      console.error(`[DP_CRM] Error in request:`, error);
      throw error;
    }
  }

  // Override search leads for DP_CRM specific format
  async searchLeads(bitrixParams) {
    const filter = {};
    const select = [];
    let limit = 50;
    let offset = 0;
    
    // Parse Bitrix24 parameters
    bitrixParams.forEach(param => {
      if (param.name.startsWith('filter[')) {
        const field = param.name.match(/filter\[(.*?)\]/)[1];
        if (field === 'PHONE') {
          // DP_CRM might expect phone in specific format
          filter.phone = this.normalizePhone(param.value);
        } else {
          filter[this.mapFieldName(field)] = param.value;
        }
      } else if (param.name === 'select[]') {
        select.push(this.mapFieldName(param.value));
      } else if (param.name === 'limit') {
        limit = parseInt(param.value);
      } else if (param.name === 'start') {
        offset = parseInt(param.value);
      }
    });

    // DP_CRM specific search endpoint
    const searchParams = {
      filters: filter,
      fields: select.length > 0 ? select : undefined,
      pagination: {
        limit,
        offset
      }
    };

    const response = await this.makeRequest('/api/v1/leads/search', searchParams);

    // Transform response back to Bitrix24 format
    return {
      result: response.data.map(lead => this.mapDPLeadToB24Format(lead)),
      total: response.meta?.total || response.data.length,
      next: response.meta?.next_offset || undefined
    };
  }

  // Create lead in DP_CRM format
  async createLead(bitrixParams) {
    let fields = {};
    
    bitrixParams.forEach(param => {
      if (param.name === 'fields') {
        fields = typeof param.value === 'string' ? JSON.parse(param.value) : param.value;
      }
    });

    // Transform to DP_CRM format
    const leadData = this.mapB24LeadToDPFormat(fields);
    
    // Create lead in DP_CRM
    const response = await this.makeRequest('/api/v1/leads', leadData, 'POST');
    
    // Return Bitrix24 format response
    return {
      result: response.data.id || response.id,
      time: {
        start: Date.now() / 1000,
        finish: Date.now() / 1000
      }
    };
  }

  // Update lead in DP_CRM
  async updateLead(bitrixParams) {
    let leadId = null;
    let fields = {};
    
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

    const updateData = this.mapB24LeadToDPFormat(fields);
    
    // Update lead in DP_CRM
    const response = await this.makeRequest(`/api/v1/leads/${leadId}`, updateData, 'PUT');
    
    return {
      result: true,
      time: {
        start: Date.now() / 1000,
        finish: Date.now() / 1000
      }
    };
  }

  // Get lead by ID from DP_CRM
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

    const response = await this.makeRequest(`/api/v1/leads/${leadId}`, null, 'GET');
    
    return {
      result: this.mapDPLeadToB24Format(response.data || response),
      time: {
        start: Date.now() / 1000,
        finish: Date.now() / 1000
      }
    };
  }

  // Create task in DP_CRM
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
      assigned_to: fields.RESPONSIBLE_ID,
      due_date: fields.DEADLINE,
      related_to: {
        type: 'lead',
        id: fields.UF_CRM_TASK ? fields.UF_CRM_TASK[0].replace('L_', '') : null
      },
      priority: fields.PRIORITY || 'normal',
      status: 'open'
    };

    const response = await this.makeRequest('/api/v1/tasks', taskData, 'POST');
    
    return {
      result: {
        task: {
          id: response.data?.id || response.id
        }
      }
    };
  }

  // Map DP_CRM lead to Bitrix24 format
  mapDPLeadToB24Format(dpLead) {
    const b24Lead = {
      ID: dpLead.id,
      TITLE: dpLead.name || dpLead.title || dpLead.company_name,
      STATUS_ID: this.mapDPStatusToB24(dpLead.status),
      COMMENTS: dpLead.notes || dpLead.description || '',
      ADDRESS: dpLead.address || '',
      ADDRESS_CITY: dpLead.city || '',
      SOURCE_ID: dpLead.source || 'WEB',
      SOURCE_DESCRIPTION: dpLead.source_details || ''
    };

    // Map contact information
    if (dpLead.phones || dpLead.phone) {
      b24Lead.PHONE = this.mapDPPhonesToB24(dpLead.phones || dpLead.phone);
    }

    if (dpLead.emails || dpLead.email) {
      b24Lead.EMAIL = this.mapDPEmailsToB24(dpLead.emails || dpLead.email);
    }

    // Map custom fields from DP_CRM
    if (dpLead.custom_fields || dpLead.metadata) {
      const cf = dpLead.custom_fields || dpLead.metadata || {};
      b24Lead.UF_CRM_TELEGRAM = cf.telegram || dpLead.telegram || '';
      b24Lead.UF_CRM_WHATSAPP = cf.whatsapp || dpLead.whatsapp || '';
      b24Lead.UF_CRM_VK = cf.vk || dpLead.vk || '';
      b24Lead.UF_CRM_INSTAGRAM = cf.instagram || dpLead.instagram || '';
      b24Lead.UF_CRM_WEBSITE = cf.website || dpLead.website || '';
      b24Lead.UF_CRM_IS_CHAIN = cf.is_chain ? 'Y' : 'N';
      b24Lead.UF_CRM_BRAND = cf.brand || '';
      b24Lead.UF_CRM_BRANCH_COUNT = cf.branch_count || 0;
      b24Lead.UF_CRM_ESTIMATED_PCS = cf.estimated_pcs || dpLead.estimated_pcs || 0;
      b24Lead.UF_CRM_PRIORITY = cf.priority || dpLead.priority || 5;
      b24Lead.UF_CRM_LEAD_SCORE = cf.lead_score || dpLead.score || 0;
      b24Lead.UF_CRM_DIALOG_HISTORY = JSON.stringify(cf.dialog_history || dpLead.communication_history || []);
      b24Lead.UF_CRM_LAST_CONTACT = cf.last_contact_date || dpLead.last_activity || '';
      b24Lead.UF_CRM_CONTACT_COUNT = cf.contact_count || dpLead.activities_count || 0;
      b24Lead.UF_CRM_PREFERRED_CHANNEL = cf.preferred_channel || '';
      b24Lead.UF_CRM_ENRICHED_AT = cf.enriched_at || dpLead.updated_at || '';
    }

    return b24Lead;
  }

  // Map Bitrix24 lead to DP_CRM format
  mapB24LeadToDPFormat(b24Lead) {
    const dpLead = {
      name: b24Lead.TITLE,
      status: this.mapB24StatusToDP(b24Lead.STATUS_ID),
      notes: b24Lead.COMMENTS,
      address: b24Lead.ADDRESS,
      city: b24Lead.ADDRESS_CITY,
      source: b24Lead.SOURCE_ID,
      source_details: b24Lead.SOURCE_DESCRIPTION
    };

    // Map phones
    if (b24Lead.PHONE) {
      dpLead.phones = this.mapB24PhonesToDP(b24Lead.PHONE);
    }

    // Map emails
    if (b24Lead.EMAIL) {
      dpLead.emails = this.mapB24EmailsToDP(b24Lead.EMAIL);
    }

    // Map custom fields
    dpLead.custom_fields = {
      telegram: b24Lead.UF_CRM_TELEGRAM,
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
      dialog_history: typeof b24Lead.UF_CRM_DIALOG_HISTORY === 'string' 
        ? JSON.parse(b24Lead.UF_CRM_DIALOG_HISTORY) 
        : b24Lead.UF_CRM_DIALOG_HISTORY,
      last_contact_date: b24Lead.UF_CRM_LAST_CONTACT,
      contact_count: parseInt(b24Lead.UF_CRM_CONTACT_COUNT) || 0,
      preferred_channel: b24Lead.UF_CRM_PREFERRED_CHANNEL,
      enriched_at: b24Lead.UF_CRM_ENRICHED_AT
    };

    return dpLead;
  }

  // Status mapping helpers
  mapDPStatusToB24(dpStatus) {
    const statusMap = {
      'new': 'NEW',
      'open': 'NEW',
      'in_progress': 'IN_PROGRESS',
      'working': 'IN_PROGRESS',
      'processed': 'PROCESSED',
      'qualified': 'PROCESSED',
      'converted': 'CONVERTED',
      'won': 'CONVERTED',
      'lost': 'JUNK',
      'junk': 'JUNK'
    };
    return statusMap[dpStatus?.toLowerCase()] || 'NEW';
  }

  mapB24StatusToDP(b24Status) {
    const statusMap = {
      'NEW': 'new',
      'IN_PROGRESS': 'in_progress',
      'PROCESSED': 'processed',
      'CONVERTED': 'converted',
      'JUNK': 'lost'
    };
    return statusMap[b24Status] || 'new';
  }

  // Phone mapping helpers
  mapDPPhonesToB24(dpPhones) {
    if (typeof dpPhones === 'string') {
      return [{ VALUE: dpPhones, VALUE_TYPE: 'WORK' }];
    }
    if (Array.isArray(dpPhones)) {
      return dpPhones.map(phone => ({
        VALUE: typeof phone === 'string' ? phone : phone.number || phone.value,
        VALUE_TYPE: phone.type?.toUpperCase() || 'WORK'
      }));
    }
    return [];
  }

  mapB24PhonesToDP(b24Phones) {
    if (!Array.isArray(b24Phones)) {
      return [];
    }
    return b24Phones.map(phone => ({
      number: phone.VALUE,
      type: phone.VALUE_TYPE?.toLowerCase() || 'work'
    }));
  }

  // Email mapping helpers
  mapDPEmailsToB24(dpEmails) {
    if (typeof dpEmails === 'string') {
      return [{ VALUE: dpEmails, VALUE_TYPE: 'WORK' }];
    }
    if (Array.isArray(dpEmails)) {
      return dpEmails.map(email => ({
        VALUE: typeof email === 'string' ? email : email.address || email.value,
        VALUE_TYPE: email.type?.toUpperCase() || 'WORK'
      }));
    }
    return [];
  }

  mapB24EmailsToDP(b24Emails) {
    if (!Array.isArray(b24Emails)) {
      return [];
    }
    return b24Emails.map(email => ({
      address: email.VALUE,
      type: email.VALUE_TYPE?.toLowerCase() || 'work'
    }));
  }

  // Phone normalization helper
  normalizePhone(phone) {
    // Remove all non-digits
    let normalized = phone.replace(/\D/g, '');
    
    // Russian phone normalization
    if (normalized.startsWith('8') && normalized.length === 11) {
      normalized = '7' + normalized.substring(1);
    }
    
    // Add + if missing
    if (!normalized.startsWith('+')) {
      normalized = '+' + normalized;
    }
    
    return normalized;
  }
}

module.exports = DPCRMAdapter;