type Params = Record<string, string | number | undefined>;

function q(params?: Params) {
  return params ? `?${new URLSearchParams(Object.entries(params).filter(([,v])=>v!=null).map(([k,v])=>[k,String(v)]))}` : '';
}

export const analyticsApi = {
  getStudyStats: async (params?: Params) => {
    const res = await fetch(`/api/analytics/stats${q(params)}`);
    return res.json();
  },
  getStreaks: async (params?: Params) => {
    const res = await fetch(`/api/analytics/streaks${q(params)}`);
    return res.json();
  },
  getMastery: async (params?: Params) => {
    const res = await fetch(`/api/analytics/mastery${q(params)}`);
    return res.json();
  }
};
