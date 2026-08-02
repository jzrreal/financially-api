let redis = null
let client = null
let isConnected = false
let initialized = false
const RedisPrefix = process.env.REDIS_PREFIX || 'fncly'

try {
  redis = require('async-redis')
} catch (error) {
  // Redis not available, will gracefully fallback
}

function generateKey(prefix, params) {
  const values = Object.values(params).join(':')
  return `${RedisPrefix}:${prefix}:${values}`
}

async function get(prefix, params) {
  if (!isConnected || !client) return null
  try {
    const key = generateKey(prefix, params)
    const [value, ttl] = await Promise.all([
      client.get(key),
      client.ttl(key)
    ])
    if (!value) return null
    const parsedData = JSON.parse(value)
    return {
      data: parsedData.data || parsedData,
      meta: {
        key,
        ttl: ttl > 0 ? ttl : null,
        cached: true,
        cachedAt: parsedData._meta && parsedData._meta.cachedAt || null,
        expiresAt: parsedData._meta && parsedData._meta.expiresAt || null
      }
    }
  } catch (error) {
    return null
  }
}

async function set(prefix, params, data, ttl = 3600) {
  if (!isConnected || !client) return false
  try {
    const key = generateKey(prefix, params)
    const cachedAt = new Date().toISOString()
    const dataWithMeta = {
      data,
      _meta: {
        key,
        ttl,
        cachedAt,
        expiresAt: new Date(Date.now() + ttl * 1000).toISOString()
      }
    }
    const serialized = JSON.stringify(dataWithMeta)
    if (serialized.length > 10 * 1024 * 1024) {
      return false
    }
    await client.setex(key, ttl, serialized)
    return true
  } catch (error) {
    return false
  }
}

async function useRedis(ctx, next) {
  if (!initialized && redis) {
    initialized = true
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
      const clientOptions = {
        retry_strategy: function(options) {
          const maxAttempts = 5
          const baseDelay = 1000
          if (options.attempt > maxAttempts) {
            ctx.log.debug(
              `Redis: Max retry attempts (${maxAttempts}) reached, giving up`
            )
            return undefined
          }
          const power = options.attempt - 1
          const delay = baseDelay *
            Math.pow(2, power)
          ctx.log.debug(
            'Redis: Retry attempt ' +
              `${options.attempt}/${maxAttempts} in ${delay}ms`
          )
          return delay
        }
      }
      if (redisUrl.startsWith('rediss://')) {
        clientOptions.tls = {
          rejectUnauthorized: false
        }
      }
      client = redis.createClient(redisUrl, clientOptions)
      await new Promise((resolve) => {
        const timeout = setTimeout(() => {
          isConnected = false
          resolve()
        }, 2000)
        client.on('connect', () => {
          ctx.log.debug({ redisUrl }, 'Redis connected')
          clearTimeout(timeout)
          isConnected = true
          resolve()
        })
        client.on('error', (error) => {
          ctx.log.debug({ redisUrl, error }, 'Redis connection error')
          clearTimeout(timeout)
          isConnected = false
          resolve()
        })
      })
    } catch (error) {
      isConnected = false
    }
  }
  if (isConnected) {
    ctx.cache = {
      get,
      set,
      meta: {
        enabled: true,
        connected: true,
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      }
    }
  }
  await next()
}

module.exports = { useRedis }
