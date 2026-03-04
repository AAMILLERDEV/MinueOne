import { supabase } from './supabaseClient';
import Anthropic from '@anthropic-ai/sdk';

// ---------------------------------------------------------------------------
// Entity compatibility layer
// Mimics the Base44 entity API: .filter(), .list(), .create(), .update(), .delete()
// ---------------------------------------------------------------------------

function createEntityApi(tableName) {
  return {
    // filter(filterObj, sortField?) — sortField '-field' = DESC, 'field' = ASC
    filter: async (filterObj, sortField) => {
      let query = supabase.from(tableName).select('*');
      if (filterObj && Object.keys(filterObj).length > 0) {
        query = query.match(filterObj);
      }
      if (sortField) {
        const desc = sortField.startsWith('-');
        query = query.order(desc ? sortField.slice(1) : sortField, { ascending: !desc });
      }
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },

    // list(sortField?, limit?)
    list: async (sortField, limit) => {
      let query = supabase.from(tableName).select('*');
      if (sortField) {
        const desc = sortField.startsWith('-');
        query = query.order(desc ? sortField.slice(1) : sortField, { ascending: !desc });
      }
      if (limit) query = query.limit(limit);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },

    create: async (data) => {
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    update: async (id, data) => {
      const { data: result, error } = await supabase
        .from(tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return result;
    },

    delete: async (id) => {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },
  };
}

// ---------------------------------------------------------------------------
// Auth compatibility layer
// ---------------------------------------------------------------------------

const auth = {
  me: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  isAuthenticated: async () => {
    const { data } = await supabase.auth.getSession();
    return !!data.session;
  },

  redirectToLogin: (redirectUrl) => {
    const redirect = redirectUrl ? `?redirect=${encodeURIComponent(redirectUrl)}` : '';
    window.location.href = `/login${redirect}`;
  },

  logout: async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  },
};

// ---------------------------------------------------------------------------
// Integrations compatibility layer
// ---------------------------------------------------------------------------

const integrations = {
  Core: {
    InvokeLLM: async ({ prompt, response_json_schema }) => {
      const client = new Anthropic({
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      const systemPrompt = response_json_schema
        ? `You are a helpful assistant. Respond ONLY with valid JSON matching this schema: ${JSON.stringify(response_json_schema)}. Do not include any text outside the JSON.`
        : 'You are a helpful assistant.';

      const response = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = response.content[0].text;

      if (response_json_schema) {
        try {
          return JSON.parse(text);
        } catch {
          const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
          if (match) return JSON.parse(match[0]);
          throw new Error('LLM did not return valid JSON');
        }
      }

      return text;
    },

    UploadFile: async ({ file }) => {
      const ext = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { data, error } = await supabase.storage
        .from('uploads')
        .upload(fileName, file, { upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(data.path);
      return { file_url: publicUrl };
    },
  },
};

// ---------------------------------------------------------------------------
// Exported base44 compatibility object — same shape as the Base44 SDK
// so all existing page/component imports continue to work unchanged.
// ---------------------------------------------------------------------------

export const base44 = {
  auth,
  entities: {
    Profile: createEntityApi('profiles'),
    SwipeAction: createEntityApi('swipe_actions'),
    Match: createEntityApi('matches'),
    Message: createEntityApi('messages'),
    Event: createEntityApi('events'),
    EventAttendee: createEntityApi('event_attendees'),
    Meeting: createEntityApi('meetings'),
    MatchInsight: createEntityApi('match_insights'),
    TeamNote: createEntityApi('team_notes'),
    TeamLink: createEntityApi('team_links'),
    AnonymousProfile: createEntityApi('anonymous_profiles'),
  },
  integrations,
  appLogs: {
    logUserInApp: async () => {}, // no-op
  },
};
