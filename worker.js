import flatten from 'flat'

export default {
  fetch: async (req, env) => {
//     const { user, redirect, body } = await env.CTX.fetch(req).then(res => res.json())
//     if (redirect) return Response.redirect(redirect)
    const { origin, pathname, search } = new URL(req.url)
    const { data, user, redirect, body } = await env.ANALYTICS.get(env.ANALYTICS.idFromName('0.1')).fetch(req).then(res => res.json())
    if (redirect) return Response.redirect(redirect)
     
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
      data,
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
    const { user, redirect, body } = await env.CTX.fetch(req).then(res => res.json())
    if (req.url.startsWith('https://analytics.do/api')) {
      const { pathname, search, searchParams } = new URL(req.url)
      const [ _, __, id ] = pathname.split('/')
      if (id) {
        const data = await this.state.storage.get(id)
        const links = Object.entries(flatten(data)).reduce((acc, [key, value]) => ({...acc, [`${key}: ${value}`]: `https://analytics.do/api?prefix=${key}:${value}`}), {})
        return new Response(JSON.stringify({data,links}))
      } else {
        const options = search == "" ? { prefix: 'id:' } : Object.fromEntries(searchParams)
        const data = await this.state.storage.list(options).then(list => Object.fromEntries(list))
        return new Response(JSON.stringify({user, redirect, body, data}))
      }
    } else {
      
      const { url, method } = req
      const { tlsClientAuth, tlsExportedAuthenticator, ...cf } = req.cf
      const { origin, hostname, pathname, search, searchParams, hash } = new URL(url)
      const query = Object.fromEntries(searchParams)
      const headers = Object.fromEntries(req.headers)
      const ts = Date.now()
      const time = new Date(ts).toISOString()
      const id = req.headers.get('cf-ray')
      const ip = req.headers.get('cf-connecting-ip')
      const ua = req.headers.get('user-agent')
      const referer = req.headers.get('referer')
      const body = req.body ? await req.json() : undefined
      
      const event = { id, ip, ts, time, url, method, origin, hostname, pathname, search, query, hash, ua, referer, cf, headers, body }
      
      this.state.storage.put(id, event)
      this.state.storage.put(`id:${id}:url:${referer?.replace('https://')}:colo:${cf.colo} -> ${id}`, 'https://analytics.do/api/' + id)
      Object.entries(flatten(event)).map(([key, value]) => this.state.storage.put(`${key}: ${value} -> ${id}`, 'https://analytics.do/api/' + id))
      
      return new Response(JSON.stringify({ user, redirect, body, data: { stored: true }}))
    }
  }
}
