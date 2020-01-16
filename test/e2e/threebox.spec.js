const assert = require('assert')
const webdriver = require('selenium-webdriver')
const getPort = require('get-port')

const { By, until } = webdriver
const {
  tinyDelayMs,
  regularDelayMs,
  largeDelayMs,
} = require('./helpers')
const { buildWebDriver } = require('./webdriver')
const Ganache = require('./ganache')
const enLocaleMessages = require('../../app/_locales/en/messages.json')

const ganacheServer = new Ganache()

describe('MetaMask', function () {
  let driver

  const testSeedPhrase = 'forum vessel pink push lonely enact gentle tail admit parrot grunt dress'

  this.timeout(0)
  this.bail(true)

  before(async function () {
    await ganacheServer.start({
      accounts: [
        {
          secretKey: '0x53CB0AB5226EEBF4D872113D98332C1555DC304443BEE1CF759D15798D3C55A9',
          balance: 25000000000000000000,
        },
      ],
    })
    const result = await buildWebDriver({ port: await getPort() })
    driver = result.driver
  })

  afterEach(async function () {
    if (process.env.SELENIUM_BROWSER === 'chrome') {
      const errors = await driver.checkBrowserForConsoleErrors(driver)
      if (errors.length) {
        const errorReports = errors.map(err => err.message)
        const errorMessage = `Errors found in browser console:\n${errorReports.join('\n')}`
        console.error(new Error(errorMessage))
      }
    }
    if (this.currentTest.state === 'failed') {
      await driver.verboseReportOnFailure(driver, this.currentTest)
    }
  })

  after(async function () {
    await ganacheServer.quit()
    await driver.quit()
  })

  describe('set up data to be restored by 3box', () => {

    describe('First time flow starting from an existing seed phrase', () => {
      it('clicks the continue button on the welcome screen', async () => {
        await driver.findElement(By.css('.welcome-page__header'))
        await driver.clickElement(By.xpath(`//button[contains(text(), '${enLocaleMessages.getStarted.message}')]`))
        await driver.delay(largeDelayMs)
      })

      it('clicks the "Import Wallet" option', async () => {
        await driver.clickElement(By.xpath(`//button[contains(text(), 'Import Wallet')]`))
        await driver.delay(largeDelayMs)
      })

      it('clicks the "No thanks" option on the metametrics opt-in screen', async () => {
        await driver.clickElement(By.css('.btn-default'))
        await driver.delay(largeDelayMs)
      })

      it('imports a seed phrase', async () => {
        const [seedTextArea] = await driver.findElements(By.css('textarea.first-time-flow__textarea'))
        await seedTextArea.sendKeys(testSeedPhrase)
        await driver.delay(regularDelayMs)

        const [password] = await driver.findElements(By.id('password'))
        await password.sendKeys('correct horse battery staple')
        const [confirmPassword] = await driver.findElements(By.id('confirm-password'))
        confirmPassword.sendKeys('correct horse battery staple')

        await driver.clickElement(By.css('.first-time-flow__checkbox'))

        await driver.clickElement(By.xpath(`//button[contains(text(), 'Import')]`))
        await driver.delay(regularDelayMs)
      })

      it('clicks through the success screen', async () => {
        await driver.findElement(By.xpath(`//div[contains(text(), 'Congratulations')]`))
        await driver.clickElement(By.xpath(`//button[contains(text(), '${enLocaleMessages.endOfFlowMessage10.message}')]`))
        await driver.delay(regularDelayMs)
      })

      it('balance renders', async () => {
        const balance = await driver.findElement(By.css('.balance-display .token-amount'))
        await driver.wait(until.elementTextMatches(balance, /25\s*ETH/))
        await driver.delay(regularDelayMs)
      })
    })

    describe('turns on threebox syncing', () => {
      it('goes to the settings screen', async () => {
        await driver.clickElement(By.css('.account-menu__icon'))
        await driver.delay(regularDelayMs)

        await driver.clickElement(By.xpath(`//div[contains(text(), 'Settings')]`))
      })

      it('turns on threebox syncing', async () => {
        await driver.clickElement(By.xpath(`//div[contains(text(), 'Advanced')]`))
        await driver.clickElement(By.css('[data-testid="advanced-setting-3box"] .toggle-button div'))
      })

    })

    describe('updates settings and address book', () => {
      it('adds an address to the contact list', async () => {
        await driver.clickElement(By.xpath(`//div[contains(text(), 'General')]`))
      })

      it('turns on use of blockies', async () => {
        await driver.clickElement(By.css('.toggle-button > div'))
      })

      it('adds an address to the contact list', async () => {
        await driver.clickElement(By.xpath(`//div[contains(text(), 'Contacts')]`))

        await driver.clickElement(By.css('.address-book-add-button__button'))
        await driver.delay(tinyDelayMs)

        const addAddressInputs = await driver.findElements(By.css('input'))
        await addAddressInputs[0].sendKeys('Test User Name 11')

        await driver.delay(tinyDelayMs)

        await addAddressInputs[1].sendKeys('0x2f318C334780961FB129D2a6c30D0763d9a5C970')

        await driver.delay(largeDelayMs * 2)

        await driver.clickElement(By.xpath(`//button[contains(text(), 'Save')]`))

        await driver.findElement(By.xpath(`//div[contains(text(), 'Test User Name 11')]`))
        await driver.delay(regularDelayMs)
      })
    })

  })

  describe('restoration from 3box', () => {
    let driver2

    before(async function () {
      const result = await buildWebDriver({ port: await getPort() })
      driver2 = result.driver
    })

    after(async function () {
      await driver2.quit()
    })

    describe('First time flow starting from an existing seed phrase', () => {
      it('clicks the continue button on the welcome screen', async () => {
        await driver2.findElement(By.css('.welcome-page__header'))
        await driver2.clickElement(By.xpath(`//button[contains(text(), '${enLocaleMessages.getStarted.message}')]`))
        await driver2.delay(largeDelayMs)
      })

      it('clicks the "Import Wallet" option', async () => {
        await driver2.clickElement(By.xpath(`//button[contains(text(), 'Import Wallet')]`))
        await driver2.delay(largeDelayMs)
      })

      it('clicks the "No thanks" option on the metametrics opt-in screen', async () => {
        await driver2.clickElement(By.css('.btn-default'))
        await driver2.delay(largeDelayMs)
      })

      it('imports a seed phrase', async () => {
        const [seedTextArea] = await driver2.findElements(By.css('textarea.first-time-flow__textarea'))
        await seedTextArea.sendKeys(testSeedPhrase)
        await driver2.delay(regularDelayMs)

        const [password] = await driver2.findElements(By.id('password'))
        await password.sendKeys('correct horse battery staple')
        const [confirmPassword] = await driver2.findElements(By.id('confirm-password'))
        confirmPassword.sendKeys('correct horse battery staple')

        await driver2.clickElement(By.css('.first-time-flow__checkbox'))

        await driver2.clickElement(By.xpath(`//button[contains(text(), 'Import')]`))
        await driver2.delay(regularDelayMs)
      })

      it('clicks through the success screen', async () => {
        await driver2.findElement(By.xpath(`//div[contains(text(), 'Congratulations')]`))
        await driver2.clickElement(By.xpath(`//button[contains(text(), '${enLocaleMessages.endOfFlowMessage10.message}')]`))
        await driver2.delay(regularDelayMs)
      })

      it('balance renders', async () => {
        const balance = await driver2.findElement(By.css('.balance-display .token-amount'))
        await driver2.wait(until.elementTextMatches(balance, /25\s*ETH/))
        await driver2.delay(regularDelayMs)
      })
    })

    describe('restores 3box data', () => {
      it('confirms the 3box restore notification', async () => {
        await driver2.clickElement(By.css('.home-notification__accept-button'))
      })

      // TODO: Fix tests from here forward; they're using the wrong driver
      it('goes to the settings screen', async () => {
        await driver.clickElement(By.css('.account-menu__icon'))
        await driver.delay(regularDelayMs)

        await driver.clickElement(By.xpath(`//div[contains(text(), 'Settings')]`))
      })

      it('finds the blockies toggle turned on', async () => {
        await driver.delay(regularDelayMs)
        const toggleLabel = await driver.findElement(By.css('.toggle-button__status-label'))
        const toggleLabelText = await toggleLabel.getText()
        assert.equal(toggleLabelText, 'ON')
      })

      it('finds the restored address in the contact list', async () => {
        await driver.clickElement(By.xpath(`//div[contains(text(), 'Contacts')]`))
        await driver.delay(regularDelayMs)

        await driver.findElement(By.xpath(`//div[contains(text(), 'Test User Name 11')]`))
        await driver.delay(regularDelayMs)
      })
    })
  })
})
