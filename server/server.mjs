// import http from 'http'
import { listenAndServe } from 'https://deno.land/std@0.113.0/http/server.ts'
import { urlParse } from 'https://deno.land/x/url_parse/mod.ts'
export default class Server {
  constructor (config, mwExtras) {
    this.config = config
    this.router = this.router.bind(this)
    this.stop = this.stop.bind(this)
    // this.server = http.createServer(this.router)
    this.mwExtras = mwExtras
    this.routes = {
      PUT: {},
      GET: {},
      POST: {},
      PATCH: {},
      DELETE: {}
    }
  }

  unpackArgs (args) {
    let route; let middlewares = []; let handler
    args.forEach(arg => {
      if (typeof arg === 'function') {
        return handler = arg
      }
      if (typeof arg === 'string') {
        return route = arg
      }
      if (typeof arg.length !== 'undefined') {
        return middlewares = arg
      }
    })
    return { route, middlewares, handler }
  }

  get (...args) {
    const { route, middlewares, handler } = this.unpackArgs(args)
    this.assign('GET', route, middlewares, handler)
  }

  post (...args) {
    const { route, middlewares, handler } = this.unpackArgs(args)
    this.assign('POST', route, middlewares, handler)
  }

  delete (...args) {
    const { route, middlewares, handler } = this.unpackArgs(args)
    this.assign('DELETE', route, middlewares, handler)
  }

  put (...args) {
    const { route, middlewares, handler } = this.unpackArgs(args)
    this.assign('PUT', route, middlewares, handler)
  }

  patch (...args) {
    const { route, middlewares, handler } = this.unpackArgs(args)
    this.assign('PATCH', route, middlewares, handler)
  }

  fallbackStatic (dir) {
    // todo add static caching for prod mode
    this.fallbackDir = dir
  }

  assign (method, route, middlewares, handler) {
    const partitioned = route.split('/').filter(f => f.length > 0)
    const rLen = partitioned.length
    const unparams = partitioned.filter(p => p[0] !== ':')
    const params = partitioned.map((i, index) => i[0] === ':' ? {
      name: i.slice(1),
      index
    } : false).filter(f => f)
    this.routes[method][partitioned.join('/')] = {
      partitioned,
      middlewares,
      rLen,
      unparams,
      params,
      route,
      handler
    }
  }

  mime (type) {
    const suffix = type[0].split('.').slice(-1)[0]
    switch (suffix) {
      case 'js':
        return 'text/javascript'
      case 'html':
        return 'text/html'
      case 'ico':
        return 'image/x-icon'
      case 'css':
        return 'text/css'
    }
  }

  pickRoute (method, pathname) {
    const iteration = 0
    const split = pathname.split('/').filter(f => f && f.length > 0)
    if (this.routes[method][pathname]) {
      return this.routes[method][pathname]
    }
    const availRoutes = this.routes[method]
    const rKey = Object.keys(availRoutes).find(rk => {
      const inspectingRoute = this.routes[method][rk]
      if (split.length !== inspectingRoute.rLen || inspectingRoute.unparams.some(up => !split.includes(up))) {
        return false
      }
      return true
    })
    return this.routes[method][rKey]
  }

  async router (req) {
    const pUrl = urlParse(req.url)
    const route = this.pickRoute(req.method, pUrl.pathname)
    const splitRoute = pUrl.pathname.split('/').filter(f => f.length > 0)
    let data
    try {
      data = await req.json()
    } catch (e) {
      data = await req.text()
    }
    const res = {
      statusCode: 200
    }
    let resWrapped = Object.assign(res || {}, {
      send: content => {
        const respBody = typeof content === 'string'
          ? `${content}\n`
          : `${JSON.stringify(content)}\n`
        return new Response(respBody, { status: res.statusCode })
      },
      status: sc => {
        res.statusCode = sc
        return resWrapped
      }
    })
    let reqWrapped = Object.assign({}, req, {
      data,
      params: route && route.params.reduce((acc, val) => {
        return {
          ...acc,
          [val.name]: splitRoute[val.index]
        }
      }, {})
    })
    if (route.middlewares.length > 0) {
      let toMiddle = [...route.middlewares]
      while (toMiddle.length > 0) {
        const mw = toMiddle.shift()
        const ran = mw(reqWrapped, resWrapped, this.mwExtras)
        reqWrapped = ran.req
        resWrapped = ran.res
        if (!resWrapped) {
          toMiddle = []
        }
      }
    }
    if (route) {
      const response = route.handler(reqWrapped, resWrapped)
      return response
    }
  }

  async start () {
    await listenAndServe(`:${this.config.port}`, req => this.router(req))
  }

  stop () {
    try {
      // figure out how to spin down better
      // this.server.close()
    } catch (e) {
      console.log('unable to destroy http server', e)
    }
  }
}
