/*! Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *  SPDX-License-Identifier: MIT-0
 */

const chromium = require('chrome-aws-lambda')
const fs = require('fs');

const agent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/83.0.4103.116 Safari/537.36'

exports.handler = async (event, context) => {
  console.info("EVENT\n" + JSON.stringify(event, null, 2))
  let browser = null
  let pdf = null
  let screenshot = null

  try {
    browser = await chromium.puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    })
    console.log('Puppeteer launched successfully, version:')
    console.log(await browser.version())

    let page = await browser.newPage()
    await page.setUserAgent(agent)

    const html = fs.readFileSync('chart.html', 'utf8')
      .replace('${persentScheduled}', event.queryStringParameters.persentScheduled)
      .replace('${persentReview}', event.queryStringParameters.persentReview)
    console.log('Sending HTML content to browser:')
    await page.setContent(html)
    await page.setViewport({
      width: 500,
      height: 1600,
      deviceScaleFactor: 1,
      isLandscape: true,
    })
    const selector = '#chartContainer';
    await page.waitForSelector(selector);
    const element = await page.$(selector);
    imageBuffer = await element.screenshot({
      type: 'jpeg',
      quality: 100,
      omitBackground: true
    })
    console.log('Done writing PDF.')
    console.log(imageBuffer.toString('base64'))

    console.log('Shutting down Chrome...')
    await page.close()
    await browser.close()
  } catch (error) {
    console.log(error)
  } finally {
    if (browser !== null) {
      await browser.close()
    }
  }

  var response = {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST',
      'Content-type': 'image/jpeg',//'application/pdf',
      //'Content-Disposition': 'attachment; filename="picture.jpeg"',
    },
    isBase64Encoded: true,
    body: imageBuffer.toString('base64')//pdf.toString('base64'),
  }

  return response;
}
