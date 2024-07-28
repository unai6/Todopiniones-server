
const puppeteer = require('puppeteer')
const cheerio = require('cheerio')

const PAGE_URL = 'https://www.amazon.es/s?k=cafetera+autom%C3%A1tica&dc&__mk_es_ES=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=16WTAB8IV83UX&qid=1722165390&rnid=831271031&sprefix=cafeteras+autom%C3%A1tica%2Caps%2C117&ref=sr_nr_p_72_1&ds=v1%3ASakRrouIZKgf3dHGcThuosRVZXkhCV8k9L0ksLKPpcs'

async function getCoffeeMachines (req, reply) {
  const { max } = req.query
  const browser = await puppeteer.launch({ headless: 'new' })
  const page = await browser.newPage()

  await page.goto(PAGE_URL)

  const html = await page.content()
  await browser.close()

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

    if (!title || isNaN(price)) return

    products.push({
      title,
      priceWhole,
      price: priceElement.text(),
      src,
      rating,
      href,
    })
  })

  const formattedProducts = products.filter(el => el.priceWhole <= max).sort((p1, p2) => p1.priceWhole - p2.priceWhole)

  reply.send({
    result: formattedProducts,
    count: formattedProducts.length,
  })
}

module.exports = {
  getCoffeeMachines
}
