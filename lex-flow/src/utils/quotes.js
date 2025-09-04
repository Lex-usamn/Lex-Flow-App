// Sistema de Frases Motivacionais do Lex Flow

class QuoteManager {
  constructor() {
    this.quotes = [
      // Frases sobre Produtividade
      { text: "A persistência é o caminho do êxito.", author: "Charles Chaplin", category: "produtividade" },
      { text: "O sucesso é a soma de pequenos esforços repetidos dia após dia.", author: "Robert Collier", category: "produtividade" },
      { text: "Não espere por oportunidades extraordinárias. Agarre ocasiões comuns e as torne grandes.", author: "Orison Swett Marden", category: "produtividade" },
      { text: "A disciplina é a ponte entre metas e conquistas.", author: "Jim Rohn", category: "produtividade" },
      { text: "Foco não é saber o que fazer, é escolher o que não fazer agora.", author: "Warren Buffett", category: "foco" },
      
      // Frases Estoicas
      { text: "Você tem poder sobre sua mente - não sobre eventos externos. Perceba isso, e você encontrará força.", author: "Marco Aurélio", category: "estoicismo" },
      { text: "A felicidade da sua vida depende da qualidade dos seus pensamentos.", author: "Marco Aurélio", category: "estoicismo" },
      { text: "Não é o que acontece com você, mas como você reage a isso que importa.", author: "Epicteto", category: "estoicismo" },
      { text: "O melhor momento para plantar uma árvore foi há 20 anos. O segundo melhor momento é agora.", author: "Provérbio Chinês", category: "ação" },
      { text: "A vida é muito curta para ser pequena.", author: "Benjamin Disraeli", category: "inspiração" },
      
      // Frases sobre Aprendizado
      { text: "Viva como se você fosse morrer amanhã. Aprenda como se você fosse viver para sempre.", author: "Mahatma Gandhi", category: "aprendizado" },
      { text: "A educação é a arma mais poderosa que você pode usar para mudar o mundo.", author: "Nelson Mandela", category: "aprendizado" },
      { text: "Quanto mais eu estudo, mais eu percebo o quanto não sei.", author: "Albert Einstein", category: "aprendizado" },
      { text: "O conhecimento é poder, mas o conhecimento aplicado é sabedoria.", author: "Francis Bacon", category: "aprendizado" },
      { text: "Aprenda continuamente - há sempre 'mais uma coisa' para aprender!", author: "Steve Jobs", category: "aprendizado" },
      
      // Frases sobre Persistência
      { text: "O fracasso é apenas a oportunidade de começar de novo, desta vez de forma mais inteligente.", author: "Henry Ford", category: "persistência" },
      { text: "Sucesso é ir de fracasso em fracasso sem perder o entusiasmo.", author: "Winston Churchill", category: "persistência" },
      { text: "A diferença entre o impossível e o possível está na determinação da pessoa.", author: "Tommy Lasorda", category: "persistência" },
      { text: "Não desista. Sofra agora e viva o resto da sua vida como um campeão.", author: "Muhammad Ali", category: "persistência" },
      { text: "A persistência é o trabalho duro que você faz depois de estar cansado do trabalho duro que já fez.", author: "Newt Gingrich", category: "persistência" },
      
      // Frases sobre Criatividade
      { text: "A criatividade é a inteligência se divertindo.", author: "Albert Einstein", category: "criatividade" },
      { text: "Inovação distingue um líder de um seguidor.", author: "Steve Jobs", category: "criatividade" },
      { text: "A imaginação é mais importante que o conhecimento.", author: "Albert Einstein", category: "criatividade" },
      { text: "Criatividade é permitir-se cometer erros. Arte é saber quais manter.", author: "Scott Adams", category: "criatividade" },
      { text: "Pense fora da caixa, desmorone a caixa, e pegue uma caixa diferente.", author: "Banksy", category: "criatividade" },
      
      // Frases sobre Liderança
      { text: "A liderança é a capacidade de traduzir visão em realidade.", author: "Warren Bennis", category: "liderança" },
      { text: "Um líder é aquele que conhece o caminho, vai pelo caminho e mostra o caminho.", author: "John C. Maxwell", category: "liderança" },
      { text: "Lidere pelo exemplo, não pela força.", author: "Sun Tzu", category: "liderança" },
      { text: "A melhor maneira de descobrir se você pode confiar em alguém é confiando nessa pessoa.", author: "Ernest Hemingway", category: "liderança" },
      { text: "Grandes líderes estão dispostos a sacrificar os números para salvar as pessoas.", author: "Simon Sinek", category: "liderança" },
      
      // Frases sobre Mindfulness
      { text: "O presente é o único momento que temos controle.", author: "Thich Nhat Hanh", category: "mindfulness" },
      { text: "Ontem é história, amanhã é um mistério, hoje é um presente.", author: "Eleanor Roosevelt", category: "mindfulness" },
      { text: "A paz vem de dentro. Não a procure fora.", author: "Buda", category: "mindfulness" },
      { text: "Seja você mesmo; todos os outros já estão ocupados.", author: "Oscar Wilde", category: "autenticidade" },
      { text: "A vida é 10% do que acontece com você e 90% de como você reage a isso.", author: "Charles R. Swindoll", category: "mindfulness" }
    ]
    
    this.customQuotes = this.loadCustomQuotes()
    this.currentQuote = null
    this.lastQuoteDate = null
    
    this.loadTodaysQuote()
  }

  loadCustomQuotes() {
    return JSON.parse(localStorage.getItem('lex-flow-custom-quotes') || '[]')
  }

  saveCustomQuotes() {
    localStorage.setItem('lex-flow-custom-quotes', JSON.stringify(this.customQuotes))
  }

  getAllQuotes() {
    return [...this.quotes, ...this.customQuotes]
  }

  getQuotesByCategory(category) {
    return this.getAllQuotes().filter(quote => quote.category === category)
  }

  getRandomQuote(category = null) {
    const quotes = category ? this.getQuotesByCategory(category) : this.getAllQuotes()
    if (quotes.length === 0) return this.quotes[0] // fallback
    
    const randomIndex = Math.floor(Math.random() * quotes.length)
    return quotes[randomIndex]
  }

  getTodaysQuote() {
    const today = new Date().toDateString()
    const savedQuote = localStorage.getItem('lex-flow-todays-quote')
    const savedDate = localStorage.getItem('lex-flow-quote-date')
    
    if (savedDate === today && savedQuote) {
      return JSON.parse(savedQuote)
    }
    
    // Gerar nova frase do dia
    const todaysQuote = this.getRandomQuote()
    localStorage.setItem('lex-flow-todays-quote', JSON.stringify(todaysQuote))
    localStorage.setItem('lex-flow-quote-date', today)
    
    return todaysQuote
  }

  loadTodaysQuote() {
    this.currentQuote = this.getTodaysQuote()
    this.lastQuoteDate = new Date().toDateString()
  }

  addCustomQuote(text, author, category = 'personalizada') {
    const newQuote = {
      text: text.trim(),
      author: author.trim(),
      category: category.toLowerCase(),
      id: Date.now(),
      custom: true,
      createdAt: new Date().toISOString()
    }
    
    this.customQuotes.push(newQuote)
    this.saveCustomQuotes()
    return newQuote
  }

  removeCustomQuote(id) {
    this.customQuotes = this.customQuotes.filter(quote => quote.id !== id)
    this.saveCustomQuotes()
  }

  getCategories() {
    const allQuotes = this.getAllQuotes()
    const categories = [...new Set(allQuotes.map(quote => quote.category))]
    return categories.sort()
  }

  searchQuotes(searchTerm) {
    const term = searchTerm.toLowerCase()
    return this.getAllQuotes().filter(quote => 
      quote.text.toLowerCase().includes(term) ||
      quote.author.toLowerCase().includes(term) ||
      quote.category.toLowerCase().includes(term)
    )
  }

  getFavoriteQuotes() {
    const favorites = JSON.parse(localStorage.getItem('lex-flow-favorite-quotes') || '[]')
    return this.getAllQuotes().filter(quote => 
      favorites.includes(quote.id || `${quote.text}-${quote.author}`)
    )
  }

  toggleFavorite(quote) {
    const favorites = JSON.parse(localStorage.getItem('lex-flow-favorite-quotes') || '[]')
    const quoteId = quote.id || `${quote.text}-${quote.author}`
    
    if (favorites.includes(quoteId)) {
      const newFavorites = favorites.filter(id => id !== quoteId)
      localStorage.setItem('lex-flow-favorite-quotes', JSON.stringify(newFavorites))
      return false
    } else {
      favorites.push(quoteId)
      localStorage.setItem('lex-flow-favorite-quotes', JSON.stringify(favorites))
      return true
    }
  }

  isFavorite(quote) {
    const favorites = JSON.parse(localStorage.getItem('lex-flow-favorite-quotes') || '[]')
    const quoteId = quote.id || `${quote.text}-${quote.author}`
    return favorites.includes(quoteId)
  }

  // Integração com API externa (opcional)
  async fetchQuoteFromAPI() {
    try {
      // Exemplo de integração com API gratuita
      const response = await fetch('https://api.quotable.io/random')
      if (response.ok) {
        const data = await response.json()
        return {
          text: data.content,
          author: data.author,
          category: 'api',
          source: 'quotable.io'
        }
      }
    } catch (error) {
      console.log('Erro ao buscar frase da API:', error)
    }
    
    // Fallback para frase local
    return this.getRandomQuote()
  }

  exportQuotes() {
    const data = {
      customQuotes: this.customQuotes,
      favorites: JSON.parse(localStorage.getItem('lex-flow-favorite-quotes') || '[]'),
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `lex-flow-quotes-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  async importQuotes(file) {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (data.customQuotes && Array.isArray(data.customQuotes)) {
        this.customQuotes = [...this.customQuotes, ...data.customQuotes]
        this.saveCustomQuotes()
        return { success: true, imported: data.customQuotes.length }
      }
      
      return { success: false, error: 'Formato de arquivo inválido' }
    } catch (error) {
      return { success: false, error: 'Erro ao processar arquivo' }
    }
  }
}

// Instância global
export const quoteManager = new QuoteManager()

// Funções de conveniência
export const getTodaysQuote = () => quoteManager.getTodaysQuote()
export const getRandomQuote = (category) => quoteManager.getRandomQuote(category)
export const addCustomQuote = (text, author, category) => quoteManager.addCustomQuote(text, author, category)
export const getQuoteCategories = () => quoteManager.getCategories()
export const searchQuotes = (term) => quoteManager.searchQuotes(term)
export const toggleFavoriteQuote = (quote) => quoteManager.toggleFavorite(quote)
export const getFavoriteQuotes = () => quoteManager.getFavoriteQuotes()
export const exportQuotes = () => quoteManager.exportQuotes()
export const importQuotes = (file) => quoteManager.importQuotes(file)

