import flatten from 'flat'
import punycode from 'punycode'

export default {
  fetch: async (req, env) => {
    const { origin, pathname, search } = new URL(req.url)
    const { data, links, user, redirect, body } = await env.ANALYTICS.get(env.ANALYTICS.idFromName('0.5')).fetch(req).then(res => res.json())
    if (redirect) return Response.redirect(redirect)
     
    return new Response(JSON.stringify({
      api: {
        icon: 'ılıl',
        name: 'analytics.do',
        description: 'Simple Analytics Service',
        url: 'https://analytics.do/api',
        type: 'https://apis.do/analytics',
        endpoints: {
          capture: origin + '/event',
          listEvents: origin + '/api',
          searchEvents: origin + '/api?prefix=cf.botManagement.score',
          getEvent: origin + '/api/:id',
        },
        site: 'https://analytics.do',
        repo: 'https://github.com/drivly/analytics.do',
      },
      data,
      links,
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
    const { user, redirect, body } = await this.env.CTX.fetch(req).then(res => res.json())
    if (req.url.startsWith('https://analytics.do/api')) {
      const { pathname, search, searchParams } = new URL(req.url)
      const [ _, __, id ] = pathname.split('/')
      if (id) {
        const data = await this.state.storage.get(id)
        const links = Object.entries(flatten(data)).reduce((acc, [key, value]) => ({...acc, [`${key}: ${value}`]: `https://analytics.do/api?prefix=${key}: ${value}`}), {})
        return new Response(JSON.stringify({user, redirect, body, data, links}), { headers: { 'content-type': 'application/json; charset=utf-8' }})
      } else {
        const options = search == "" ? { prefix: 'idx:', reverse: true } : Object.fromEntries(searchParams)
        const data = await this.state.storage.list(options).then(list => Object.fromEntries(list))
        return new Response(JSON.stringify({user, redirect, body, data}), { headers: { 'content-type': 'application/json; charset=utf-8' }})
      }
    } else {
      
      const { url, method } = req
      const { tlsClientAuth, tlsExportedAuthenticator, ...cf } = req.cf
//       const { origin, hostname, pathname, search, searchParams, hash } = new URL(url)

      const ts = Date.now()
      const time = new Date(ts).toISOString()
      const id = req.headers.get('cf-ray')
      const ip = req.headers.get('cf-connecting-ip')
      const ua = req.headers.get('user-agent')
      const referer = req.headers.get('referer')
      let { protocol, origin, hostname, pathname, search, searchParams, hash } = new URL(referer ?? url)
      hostname = punycode.toUnicode(hostname)
      const query = Object.fromEntries(searchParams)
      const headers = Object.fromEntries(req.headers)
//       const body = req.body ? await req.json() : undefined
      
      const event = { id, ip, ts, time, url, method, origin, hostname, punycode: hostname.startsWith('xn--') ? punycode.toASCII(hostname) : undefined, pathname, search, query, hash, ua, referer, cf, headers, body }
      
      this.state.storage.put(id, event)
      this.state.storage.put(`idx: ${id}-${cf.colo} ${method} ${protocol}//${hostname + pathname + search + hash} ${ip} ${cf.city}, ${cf.region} ${cf.country} ${cf.asOrganization} -> ${id}`, 'https://analytics.do/api/' + id)
      Object.entries(flatten(event)).map(([key, value]) => this.state.storage.put(`${key}: ${value} -> ${id}`, 'https://analytics.do/api/' + id))
      
      return new Response(JSON.stringify({ user, redirect, body, data: { stored: true }}))
    }
  }
}
