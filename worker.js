export default {
  fetch: (req, env) => {
    const { user, redirect, body } = await env.CTX.fetch(req).then(res => res.json())
    if (redirect) return Response.redirect(redirect)
    const { origin, pathname, search } = new URL(req.url)
    env.ANALYTICS.get(env.ANALYTICS.idFromName(new URL(req.url).hostname)).fetch(req)
     
    return new Response(JSON.stringify({
      api: {
        icon: 'ılıl',
        name: 'analytics.do',
        description: 'Simple Analytics Service',
        url: 'https://analytics.do',
        api: 'https://analytics.do/api',
        endpoints: {
          parse: origin + '/parse?prop=value',
          generate: origin + '/:url',
        },
        type: 'https://apis.do',
        repo: 'https://github.com/drivly/analytics.do',
      },
      user,
    }, null, 2), { headers: { 'content-type': 'application/json; charset=utf-8' }}) 
  }
}

export class Analytics {
  constructor(state, env) {
    this.state = state
    this.env = env
  }
  async fetch(req) {
    if (req.url == 'https://analytics.do/api') {
      const options = Object.fromEntries(new URL(req.url).searchParams)
      const data = await this.state.storage.list({reverse: true, limit: 1000}).then(list => Object.values(Object.fromEntries(list)))
      return new Response(JSON.stringify(data))
    } else {
      return new Response(JSON.stringify({ stored: true }))
    }
  }
}
