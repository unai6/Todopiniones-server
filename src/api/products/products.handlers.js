
const puppeteer =  require('puppeteer')
const cheerio = require('cheerio')
const axios = require('axios')

const fs = require('fs')
const path = require('path')


const urls = {
  'coffee-machine-auto': 'https://www.amazon.es/s?k=cafetera+autom%C3%A1tica&rh=p_72%3A831280031&dc&__mk_es_ES=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=VT9FY550ML4P&qid=1722527110&rnid=831271031&sprefix=cafetera+autom%C3%A1tica%2Caps%2C105&ref=sr_nr_p_72_1&ds=v1%3ABt8vQlTnUioZ4jAlEnrruusFZA1mlnKZkQSJbRR3l1U',
  'phone-cases': 'https://www.amazon.es/s?k=fundas+movil&rh=p_72%3A831280031&dc&qid=1722536283&rnid=831271031&ref=sr_nr_p_72_1&ds=v1%3A2xEKd3j5ztCFUpaoB0u2r%2BHWeDCGex5Gk2lZnpIqjl8',
}

async function getScrapedProducts (req, reply) {
  const { min, max } = req.query
  const products = JSON.parse(fs.readFileSync(path.join(__dirname, `/data/products-${min}-${max}.json`), 'utf-8'))

    reply.send({
      result: products,
      count: products.length,
    })
}

async function getProducts(req, reply) {
  const { product } = req.query

  const min = Number(req.query.min || 1)
  const max = Number(req.query.max || 51)

  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto(urls[product], {
    waitUntil: 'networkidle2',
  })

  try {
    const html = await page.content()
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

    const formattedProducts = products.filter(el => el.priceWhole <= max && el.priceWhole > min).sort((p1, p2) => p1.priceWhole - p2.priceWhole) || []

    fs.writeFileSync(path.join(__dirname, `/data/products-${min}-${max}.json`), JSON.stringify(formattedProducts, null, 2))

    reply.send({
      result: formattedProducts,
      count: formattedProducts.length,
    })
  } catch (err) {
    console.error(err)
    reply.internalServerError(err)
  } finally {
    await browser.close()
  }
}
// ---------
async function getProductReferralLink (productUrl) {
  const { data: html } = await axios.get(`https://www.amazon.es/${productUrl}`, {
      headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Referer': 'https://www.amazon.es/',
      'Connection': 'keep-alive',
      }
  })

  const $ = cheerio.load(html)

  const link = $('.amzn-ss-link-container')
  console.info(link.html())
}

module.exports = {
  getProducts,
  getScrapedProducts,
}
