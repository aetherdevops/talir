import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { categorizeReport, getFilingIndicatorTier, isMaterialFiling } from './news.ts'

describe('isMaterialFiling', () => {
    it('matches English material keywords', () => {
        assert.equal(isMaterialFiling('Notice of delisting from MSE'), true)
        assert.equal(isMaterialFiling('Trading suspension effective immediately'), true)
    })

    it('matches Macedonian Cyrillic keywords', () => {
        assert.equal(isMaterialFiling('Објава за ликвидација на друштво'), true)
        assert.equal(isMaterialFiling('Суспензија на тргување'), true)
        assert.equal(isMaterialFiling('Стечајна постапка'), true)
        assert.equal(isMaterialFiling('Делистирање од Берза'), true)
    })

    it('matches Latin transliterations', () => {
        assert.equal(isMaterialFiling('likvidacija postapka'), true)
        assert.equal(isMaterialFiling('delistiranje od berza'), true)
    })

    it('returns false for routine filings', () => {
        assert.equal(isMaterialFiling('Non-audited profit&loss account 01.01. - 30.09.'), false)
        assert.equal(isMaterialFiling('Audited financial statements'), false)
    })
})

describe('getFilingIndicatorTier', () => {
    it('material takes precedence over dividend category', () => {
        assert.equal(
            getFilingIndicatorTier('Delisting and dividend settlement', 'dividend'),
            'material'
        )
    })

    it('classifies dividend tier from category', () => {
        assert.equal(
            getFilingIndicatorTier('03/07/2026 - Dividend per share', 'dividend'),
            'dividend'
        )
    })

    it('defaults unknown to routine', () => {
        assert.equal(
            getFilingIndicatorTier('Audited financial statements', categorizeReport('Audited financial statements')),
            'routine'
        )
    })

    it('classifies earnings as routine', () => {
        assert.equal(
            getFilingIndicatorTier('Non-audited profit&loss account', 'earnings'),
            'routine'
        )
    })
})
