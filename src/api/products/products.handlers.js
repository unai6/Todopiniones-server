
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')
const axios = require('axios')

const urls = {
  'coffee-machine-auto': 'https://www.amazon.es/s?k=cafetera+autom%C3%A1tica&rh=p_72%3A831280031&dc&__mk_es_ES=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=VT9FY550ML4P&qid=1722527110&rnid=831271031&sprefix=cafetera+autom%C3%A1tica%2Caps%2C105&ref=sr_nr_p_72_1&ds=v1%3ABt8vQlTnUioZ4jAlEnrruusFZA1mlnKZkQSJbRR3l1U',
  'phone-cases': 'https://www.amazon.es/s?k=fundas+movil&rh=p_72%3A831280031&dc&qid=1722536283&rnid=831271031&ref=sr_nr_p_72_1&ds=v1%3A2xEKd3j5ztCFUpaoB0u2r%2BHWeDCGex5Gk2lZnpIqjl8',
}

async function getProducts (req, reply) {
  const { product } = req.query

  const min = Number(req.query.min || 1)
  const max = Number(req.query.max || 51)

  try {
    const { data: html } = await axios.get(urls[product], {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
      }
    })

    const $ = cheerio.load(html)
    const products = []

    $('.s-widget-container').each((i, element) => {
      const titleElement = $(element).find('.s-title-instructions-style')
      const priceElement = $(element).find('.a-price > span').first()
      const priceWholeElement = $(element).find('.a-price-whole')
      const imageElement = $(element).find('.s-image')
      const ratingElement = $(element).find('.a-icon-alt')
      const hrefElement = $(element).find('.a-link-normal')



      const title = titleElement.text()
      const price = parseInt(priceElement.text().replace(/[$,]/g, ""), 10)
      const priceWhole = parseFloat(priceWholeElement.text().replace('.', ''))
      const src = imageElement.attr('src')
      const rating = ratingElement.text()
      const href = hrefElement.attr('href')

      if (!title || isNaN(price) || isNaN(priceWhole)) return

      products.push({
        title,
        priceWhole: Number(priceWhole),
        price: priceElement.text(),
        src,
        rating,
        href,
      })
    })

    const formattedProducts = products.filter(el => el.priceWhole <= max && el.priceWhole > min)

    reply.send({
      result: products,
      count: products.length,
    })
  } catch (err) {
    console.error(err.response)
    reply.internalServerError(err)
  }
}

module.exports = {
  getProducts
}
