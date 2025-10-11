import { describe, it, expect } from 'vitest'

describe('Test Setup', () => {
 it('should pass basic math test', () => {
  expect(1 + 1).toBe(2)
 })

 it('should validate string operations', () => {
  expect('hello'.toUpperCase()).toBe('HELLO')
 })
})