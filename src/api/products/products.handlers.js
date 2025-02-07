
const puppeteer =  require('puppeteer')
const cheerio = require('cheerio')
const axios = require('axios')

const fs = require('fs')
const path = require('path')


const urls = {
  'coffee-machine-auto': 'https://www.amazon.es/s?k=cafetera+autom%C3%A1tica&rh=p_72%3A831280031&dc&__mk_es_ES=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=VT9FY550ML4P&qid=1722527110&rnid=831271031&sprefix=cafetera+autom%C3%A1tica%2Caps%2C105&ref=sr_nr_p_72_1&ds=v1%3ABt8vQlTnUioZ4jAlEnrruusFZA1mlnKZkQSJbRR3l1U',
  'phone-cases': 'https://www.amazon.es/s?k=fundas+movil&rh=p_72%3A831280031&dc&qid=1722536283&rnid=831271031&ref=sr_nr_p_72_1&ds=v1%3A2xEKd3j5ztCFUpaoB0u2r%2BHWeDCGex5Gk2lZnpIqjl8',
  'robot-vaccum': 'https://www.amazon.es/s?k=robot+aspirador&i=kitchen&rh=n%3A599391031%2Cp_36%3A50000-&dc&crid=2W6U2SQVJ7X6L&qid=1723053479&rnid=831271031&sprefix=robo%2Ckitchen%2C93&ref=sr_nr_p_72_1&ds=v1%3Anxs1%2FvHOIsZYH01xjUGaHBQSzdLXZmPWpygJGAEx18Y',
  'television': 'https://www.amazon.es/s?k=televisores&i=electronics&rh=n%3A599370031%2Cp_n_size_browse-bin%3A9598540031%7C9598541031%7C9598542031%7C9598543031%7C9598544031&dc&__mk_es_ES=%C3%85M%C3%85%C5%BD%C3%95%C3%91&crid=JGT5HKMRA84J&qid=1723144075&rnid=831271031&sprefix=televisores%2Celectronics%2C101&ref=sr_nr_p_72_1&ds=v1%3A9MGu3Z1itVzCkgCHCNql1JdDBIXvwpY3g8w7nT%2Fin7g',
}

// ---------
async function getScrapedProducts (req, reply) {
  const { min, max, product } = req.query
  const products = JSON.parse(fs.readFileSync(path.join(__dirname, `/data/products-${product}-${min}-${max}.json`), 'utf-8'))

    reply.send({
      result: products,
      count: products.length,
    })
}

// ---------
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

  const elements = $('.s-widget-container').toArray()

    for (const element of elements) {
        const titleElement = $(element).find('.s-title-instructions-style')
        const priceElement = $(element).find('.a-price > span').first()
        const priceWholeElement = $(element).find('.a-price-whole')
        const imageElement = $(element).find('.s-image')
        const ratingElement = $(element).find('.a-icon-alt')
        const hrefElement = $(element).find('.a-link-normal')

        const title = titleElement.text()
        const price = parseInt(priceElement.text().replace(/[$,]/g, ""), 10)
        const priceWhole = parseFloat(priceWholeElement.text())

      if (priceWhole > max || priceWhole < min || isNaN(price) || isNaN(priceWhole)) continue

        const src = imageElement.attr('src')
        const rating = ratingElement.text()
        const href = await getProductReferralLink(hrefElement.attr('href'))

        if (!title) continue

        products.push({
          title,
          priceWhole: Number(priceWhole),
          price: priceElement.text(),
          src,
          rating,
          href,
        })
    }

    const formattedProducts = products.filter(el => el.priceWhole <= max && el.priceWhole > min).sort((p1, p2) => p1.priceWhole - p2.priceWhole) || []

    fs.writeFileSync(path.join(__dirname, `/data/products-${product}-${min}-${max}.json`), JSON.stringify(formattedProducts, null, 2))

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
  if (!productUrl || productUrl ===  '/gp/help/customer/display.html?nodeId=200533820') return
  const browser = await puppeteer.launch({ headless: false })
  const page = await browser.newPage()

  // Go to Amazon sign-in page
  await page.goto('https://www.amazon.es/ap/signin?openid.pape.max_auth_age=0&openid.return_to=https%3A%2F%2Fafiliados.amazon.es%2F&openid.identity=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.assoc_handle=amzn_associates_es&openid.mode=checkid_setup&marketPlaceId=A1RKKUPIHCS9HS&language=es_ES&openid.claimed_id=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0%2Fidentifier_select&openid.ns=http%3A%2F%2Fspecs.openid.net%2Fauth%2F2.0')
  // Enter email
  await page.waitForSelector('input[name="email"]')
  await page.type('input[name="email"]', process.env.AMAZON_EMAIL)
  await page.evaluate(() =>  new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000)))

  // Enter password
  const inputContinue = await page.$('input#continue')
  if (!inputContinue) {
    await page.type('input[name="password"]', process.env.AMAZON_PWD)
    await page.evaluate(() =>  new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000)))
  } else {
    await page.click('input#continue')
    await page.waitForNavigation()
    await page.evaluate(() => new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000)))

    await page.type('input[name="password"]', process.env.AMAZON_PWD)
    await page.evaluate(() =>  new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000)))
  }

  // Click sign-in button
  await page.click('input#signInSubmit')
  await page.waitForNavigation()
  await page.evaluate(() =>  new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000)))

  // Go to the product URL
  await page.goto(`https://amazon.es${productUrl}`, { waitUntil: 'networkidle2' })

  await page.evaluate(() =>  new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000)))
  // Extract the smart link
  await page.waitForSelector('textarea#amzn-ss-text-shortlink-textarea')
  // const smartlink = await page.$eval('li#amzn-ss-text-link', el => el.textContent)
  await page.click('li#amzn-ss-text-link')
  await page.evaluate(() =>  new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000)))

  const smartLink = await page.$eval('textarea#amzn-ss-text-shortlink-textarea', el => el.value)

  await browser.close()

  console.info(smartLink, 'smartLink')

  return smartLink
}

module.exports = {
  getProducts,
  getScrapedProducts,
  getProductReferralLink,
}
