import flatten from 'flat'

export default {
  fetch: async (req, env) => {
    const { user, redirect, body } = await env.CTX.fetch(req).then(res => res.json())
    if (redirect) return Response.redirect(redirect)
    const { origin, pathname, search } = new URL(req.url)
    const data = await env.ANALYTICS.get(env.ANALYTICS.idFromName('data')).fetch(req).then(res => res.json())
     
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
        return new Response(JSON.stringify(data))
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
      this.state.storage.put(`id:${id}:url:${referer}:colo:${cf.colo} -> ${id}`, 'https://analytics.do/api/' + id)
      Object.entries(flatten(data)).map(([key, value]) => this.state.storage.put(`${key}:${value} -> ${id}`, 'https://analytics.do/api/' + id))
//       this.state.storage.put(`ip:${ip} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`ts:${ts} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`time:${time} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`url:${url} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`method:${method} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`origin:${origin} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`hostname:${hostname} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`pathname:${pathname} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`search:${search} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`hash:${hash} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`ua:${ua} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`referer:${referer} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.clientTcpRtt:${cf.clientTcpRtt} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.longitude:${cf.longitude} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.latitude:${cf.latitude} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.tlsCipher:${cf.tlsCipher} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.continent:${cf.continent} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.asn:${cf.asn} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.clientAcceptEncoding:${cf.clientAcceptEncoding} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.country:${cf.country} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.tlsVersion:${cf.tlsVersion} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.colo:${cf.colo} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.timezone:${cf.timezone} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.city:${cf.city} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.httpProtocol:${cf.httpProtocol} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.botManagement.corporateProxy:${cf.botManagement.corporateProxy} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.botManagement.staticResource:${cf.botManagement.staticResource} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.botManagement.verifiedBot:${cf.botManagement.verifiedBot} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.botManagement.ja3Hash:${cf.botManagement.ja3Hash} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.botManagement.score:${cf.botManagement.score} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.region:${cf.region} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.regionCode:${cf.regionCode} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.asOrganization:${cf.asOrganization} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.metroCode:${cf.metroCode} -> ${id}`, 'https://analytics.do/api/' + id)
//       this.state.storage.put(`cf.postalCode:${cf.postalCode} -> ${id}`, 'https://analytics.do/api/' + id)
      
      return new Response(JSON.stringify({ stored: true }))
    }
  }
}
