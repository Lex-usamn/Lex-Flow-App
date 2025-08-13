// Service Worker do Lex Flow
const CACHE_NAME = 'lex-flow-v2.0.0'
const STATIC_CACHE_NAME = 'lex-flow-static-v2.0.0'
const DYNAMIC_CACHE_NAME = 'lex-flow-dynamic-v2.0.0'

// Arquivos para cache estático
const STATIC_FILES = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
]

// Arquivos para cache dinâmico
const DYNAMIC_FILES = [
  '/api/',
  'https://fonts.googleapis.com/',
  'https://fonts.gstatic.com/'
]

// Instalar Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Instalando...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Cache estático criado')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        console.log('Service Worker: Arquivos estáticos em cache')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Erro ao instalar', error)
      })
  )
})

// Ativar Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Ativando...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('Service Worker: Removendo cache antigo', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Ativado')
        return self.clients.claim()
      })
  )
})

// Interceptar requisições
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Estratégia Cache First para arquivos estáticos
  if (STATIC_FILES.some(file => request.url.includes(file))) {
    event.respondWith(
      caches.match(request)
        .then((response) => {
          return response || fetch(request)
            .then((fetchResponse) => {
              return caches.open(STATIC_CACHE_NAME)
                .then((cache) => {
                  cache.put(request, fetchResponse.clone())
                  return fetchResponse
                })
            })
        })
        .catch(() => {
          // Fallback para página offline
          if (request.destination === 'document') {
            return caches.match('/offline.html')
          }
        })
    )
    return
  }
  
  // Estratégia Network First para dados dinâmicos
  if (request.url.includes('/api/') || request.method === 'POST') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cachear apenas respostas GET bem-sucedidas
          if (request.method === 'GET' && response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseClone)
              })
          }
          return response
        })
        .catch(() => {
          // Tentar buscar no cache se a rede falhar
          return caches.match(request)
        })
    )
    return
  }
  
  // Estratégia Stale While Revalidate para outros recursos
  event.respondWith(
    caches.match(request)
      .then((response) => {
        const fetchPromise = fetch(request)
          .then((fetchResponse) => {
            caches.open(DYNAMIC_CACHE_NAME)
              .then((cache) => {
                cache.put(request, fetchResponse.clone())
              })
            return fetchResponse
          })
        
        return response || fetchPromise
      })
  )
})

// Sincronização em background
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Sincronização em background', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(
      syncData()
    )
  }
})

// Notificações push
self.addEventListener('push', (event) => {
  console.log('Service Worker: Notificação push recebida')
  
  const options = {
    body: event.data ? event.data.text() : 'Nova notificação do Lex Flow',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Abrir App',
        icon: '/icons/action-explore.png'
      },
      {
        action: 'close',
        title: 'Fechar',
        icon: '/icons/action-close.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('Lex Flow', options)
  )
})

// Clique em notificação
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Clique em notificação', event.action)
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  } else if (event.action === 'close') {
    // Apenas fechar a notificação
  } else {
    // Clique padrão na notificação
    event.waitUntil(
      clients.matchAll({ type: 'window' })
        .then((clientList) => {
          for (let client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              return client.focus()
            }
          }
          if (clients.openWindow) {
            return clients.openWindow('/')
          }
        })
    )
  }
})

// Compartilhamento
self.addEventListener('share', (event) => {
  console.log('Service Worker: Compartilhamento recebido', event)
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        if (clientList.length > 0) {
          const client = clientList[0]
          client.postMessage({
            type: 'SHARE_RECEIVED',
            data: {
              title: event.data.title,
              text: event.data.text,
              url: event.data.url
            }
          })
          return client.focus()
        } else {
          return clients.openWindow('/?shared=true')
        }
      })
  )
})

// Função para sincronizar dados
async function syncData() {
  try {
    console.log('Service Worker: Iniciando sincronização de dados')
    
    // Verificar se há dados pendentes no IndexedDB ou localStorage
    const pendingData = await getPendingData()
    
    if (pendingData.length > 0) {
      // Tentar sincronizar cada item pendente
      for (const item of pendingData) {
        try {
          await syncItem(item)
          await markAsSynced(item.id)
        } catch (error) {
          console.error('Service Worker: Erro ao sincronizar item', error)
        }
      }
    }
    
    console.log('Service Worker: Sincronização concluída')
  } catch (error) {
    console.error('Service Worker: Erro na sincronização', error)
  }
}

// Função para obter dados pendentes
async function getPendingData() {
  // Em uma implementação real, isso buscaria dados do IndexedDB
  // Por enquanto, retornamos array vazio
  return []
}

// Função para sincronizar um item específico
async function syncItem(item) {
  const response = await fetch('/api/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(item)
  })
  
  if (!response.ok) {
    throw new Error(`Erro na sincronização: ${response.status}`)
  }
  
  return response.json()
}

// Função para marcar item como sincronizado
async function markAsSynced(itemId) {
  // Em uma implementação real, isso atualizaria o IndexedDB
  console.log('Service Worker: Item marcado como sincronizado', itemId)
}

// Limpeza periódica do cache
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAN_CACHE') {
    event.waitUntil(
      cleanOldCache()
    )
  }
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Função para limpar cache antigo
async function cleanOldCache() {
  const cacheNames = await caches.keys()
  const oldCaches = cacheNames.filter(name => 
    name.startsWith('lex-flow-') && 
    name !== STATIC_CACHE_NAME && 
    name !== DYNAMIC_CACHE_NAME
  )
  
  await Promise.all(
    oldCaches.map(cacheName => caches.delete(cacheName))
  )
  
  console.log('Service Worker: Cache antigo limpo')
}

// Atualização automática
self.addEventListener('updatefound', () => {
  console.log('Service Worker: Nova versão encontrada')
  
  const newWorker = self.registration.installing
  
  newWorker.addEventListener('statechange', () => {
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      // Nova versão disponível
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'UPDATE_AVAILABLE'
          })
        })
      })
    }
  })
})

