/**
 * VoteHub polling REST adapter. No dependencies, credentials, billing, telemetry,
 * background requests, or paid services. Intended to run in the Electron main
 * process; the React renderer should use a narrow, validated IPC bridge.
 * Docs: https://votehub.com/polls/api/ (CC BY 4.0).
 */
export const VOTEHUB_API_BASE = "https://api.votehub.com" as const;
export const VOTEHUB_LICENSE = "https://creativecommons.org/licenses/by/4.0/" as const;
export const VOTEHUB_DOCS = "https://votehub.com/polls/api/" as const;

export type VoteHubPopulation = "a" | "rv" | "lv" | string;
export type VoteHubPollFilters = {
  poll_type?: string;
  pollster?: string;
  subject?: string;
  from_date?: string;
  to_date?: string;
  min_sample_size?: number;
  population?: VoteHubPopulation;
};

export interface VoteHubAnswer {
  choice: string;
  pct: number;
}

/** Preserve raw fields; VoteHub is a beta API and may add categories/columns. */
export interface VoteHubPoll {
  id: string;
  poll_type: string;
  pollster: string;
  answers: VoteHubAnswer[];
  raw: Record<string, unknown>;
}
export interface VoteHubSubject {
  subject: string;
  poll_types: string[];
}
export interface VoteHubResponse<T> {
  data: T;
  retrievedAt: string;
  cached: boolean;
  stale: boolean;
  source: typeof VOTEHUB_DOCS;
  license: typeof VOTEHUB_LICENSE;
}

const ALLOWED_FILTERS = ["poll_type", "pollster", "subject", "from_date", "to_date", "min_sample_size", "population"] as const;
function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function requiredText(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0) throw new Error(\`VoteHub: missing/invalid \${field}\`);
  return value;
}
function checkedDate(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(\`\${value}T00:00:00Z\`))) {
    throw new Error(\`VoteHub: invalid \${field} (expected YYYY-MM-DD)\`);
  }
  return value;
}
function toAnswer(value: unknown): VoteHubAnswer {
  if (!record(value) || typeof value.choice !== "string" || typeof value.pct !== "number" || !Number.isFinite(value.pct)) {
    throw new Error("VoteHub: malformed poll answer");
  }
  return { choice: value.choice, pct: value.pct };
}
export function parseVoteHubPoll(value: unknown): VoteHubPoll {
  if (!record(value) || !Array.isArray(value.answers)) throw new Error("VoteHub: malformed poll");
  return {
    id: requiredText(value.id, "poll.id"),
    poll_type: requiredText(value.poll_type, "poll.poll_type"),
    pollster: requiredText(value.pollster, "poll.pollster"),
    answers: value.answers.map(toAnswer),
    raw: { ...value },
  };
}
export function voteHubPollsUrl(filters: VoteHubPollFilters = {}): string {
  const params = new URLSearchParams();
  for (const key of ALLOWED_FILTERS) {
    const input = filters[key];
    if (input === undefined || input === "") continue;
    if (key === "min_sample_size") {
      if (typeof input !== "number" || !Number.isSafeInteger(input) || input < 0) throw new Error("VoteHub: invalid min_sample_size");
      params.set(key, String(input));
    } else if (key === "from_date" || key === "to_date") {
      params.set(key, checkedDate(input, key));
    } else {
      if (typeof input !== "string" || input.length > 200) throw new Error(\`VoteHub: invalid \${key}\`);
      params.set(key, input);
    }
  }
  if (filters.from_date && filters.to_date && filters.from_date > filters.to_date) throw new Error("VoteHub: from_date is after to_date");
  const suffix = params.toString();
  return \`\${VOTEHUB_API_BASE}/polls\${suffix ? \`?\${suffix}\` : ""}\`;
}

export interface VoteHubClientOptions {
  fetcher?: typeof fetch;
  now?: () => number;
  cacheMs?: number;
  timeoutMs?: number;
}

type Cached = { value: unknown; timestamp: number };
export class VoteHubClient {
  private readonly fetcher: typeof fetch;
  private readonly now: () => number;
  private readonly cacheMs: number;
  private readonly timeoutMs: number;
  private readonly cache = new Map<string, Cached>();

  constructor(options: VoteHubClientOptions = {}) {
    this.fetcher = options.fetcher ?? fetch;
    this.now = options.now ?? Date.now;
    this.cacheMs = options.cacheMs ?? 60 * 60 * 1000;
    this.timeoutMs = options.timeoutMs ?? 20_000;
    if (this.cacheMs < 0 || this.timeoutMs <= 0) throw new Error("VoteHub: invalid client timing");
  }

  private async request<T>(url: string, parse: (value: unknown) => T, forceRefresh = false): Promise<VoteHubResponse<T>> {
    // Only URLs generated in this module. No arbitrary URL/host from user input.
    if (!url.startsWith(\`\${VOTEHUB_API_BASE}/\`)) throw new Error("VoteHub: invalid upstream host");
    const cached = this.cache.get(url);
    if (!forceRefresh && cached && this.now() - cached.timestamp < this.cacheMs) {
      return this.wrap(parse(cached.value), cached.timestamp, true, false);
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetcher(url, { signal: controller.signal, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(\`VoteHub: HTTP \${response.status}\`);
      const raw: unknown = await response.json();
      const data = parse(raw); // Never cache a payload that fails schema validation.
      const timestamp = this.now();
      this.cache.set(url, { value: raw, timestamp });
      return this.wrap(data, timestamp, false, false);
    } catch (error) {
      if (cached) return this.wrap(parse(cached.value), cached.timestamp, true, true);
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }
  private wrap<T>(data: T, timestamp: number, cached: boolean, stale: boolean): VoteHubResponse<T> {
    return { data, retrievedAt: new Date(timestamp).toISOString(), cached, stale, source: VOTEHUB_DOCS, license: VOTEHUB_LICENSE };
  }

  /** No filters means ALL available poll types, rather than generic-ballot only. */
  getPolls(filters: VoteHubPollFilters = {}, forceRefresh = false): Promise<VoteHubResponse<VoteHubPoll[]>> {
    return this.request(voteHubPollsUrl(filters), (value) => {
      if (!record(value) || !Array.isArray(value.polls)) throw new Error("VoteHub: expected polls array");
      return value.polls.map(parseVoteHubPoll);
    }, forceRefresh);
  }
  getPollById(id: string, forceRefresh = false): Promise<VoteHubResponse<VoteHubPoll>> {
    if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) throw new Error("VoteHub: invalid poll ID");
    return this.request(\`\${VOTEHUB_API_BASE}/polls/\${encodeURIComponent(id)}\`, parseVoteHubPoll, forceRefresh);
  }
  getPollsters(forceRefresh = false): Promise<VoteHubResponse<string[]>> {
    return this.request(\`\${VOTEHUB_API_BASE}/pollsters\`, (value) => {
      if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) throw new Error("VoteHub: invalid pollster list");
      return value;
    }, forceRefresh);
  }
  getPollTypes(forceRefresh = false): Promise<VoteHubResponse<string[]>> {
    return this.request(\`\${VOTEHUB_API_BASE}/poll-types\`, (value) => {
      if (!Array.isArray(value) || !value.every((v) => typeof v === "string")) throw new Error("VoteHub: invalid poll-type list");
      return value;
    }, forceRefresh);
  }
  getSubjects(forceRefresh = false): Promise<VoteHubResponse<VoteHubSubject[]>> {
    return this.request(\`\${VOTEHUB_API_BASE}/subjects\`, (value) => {
      if (!Array.isArray(value)) throw new Error("VoteHub: invalid subjects list");
      return value.map((item): VoteHubSubject => {
        if (!record(item) || typeof item.subject !== "string" || !Array.isArray(item.poll_types) || !item.poll_types.every((v) => typeof v === "string")) {
          throw new Error("VoteHub: invalid subject entry");
        }
        return { subject: item.subject, poll_types: item.poll_types };
      });
    }, forceRefresh);
  }
}
